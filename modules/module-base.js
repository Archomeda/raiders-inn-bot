'use strict';

const
    config = require('config'),
    NodeCache = require('node-cache')
    Promise = require('bluebird');

const cache = new NodeCache();

class ModuleBase {
    constructor(bot) {
        if (new.target === ModuleBase) {
            throw new TypeError('cannot construct ModuleBase instances directly');
        }

        this.bot = bot;
        this.name = new.target.name.replace(/(.*?)(Module)?/, '$1');
        this._commands = [];

        this.onMessage = this.onMessage.bind(this);
        this.bot.getClient().on('message', this.onMessage);
    }

    get commands() {
        return this._commands;
    }

    onMessage(message) {
        const [command, params] = this.parseCommandString(message);

        // If the command is empty, we ignore the message
        if (!command) {
            return;
        }

        // If the command is executed from a disabled channel type, we ignore the message
        if (!this.checkCommandChannelType(message, command)) {
            return;
        }

        // If the command is not executed from a specific channel, we ignore the message
        if (!this.checkCommandChannel(message, command)) {
            return;
        }

        // Check the command cooldowns
        switch (this.checkCommandCooldowns(message, command)) {
            case 'warn-command-global':
                return message.reply('This command has already been executed recently. Please wait a bit before executing it again.');
            case 'warn-command-user':
                return message.reply(`You've already executed this command recently. Please wait a bit before executing it again.`);
            case 'warn-user':
                return message.reply(`You've already executed a command recently. Please wait a bit before executing another.`);
            case false:
                return;
        }

        // If the user does not have the correct permissions, we warn the user
        if (!this.checkCommandPermission(message, command)) {
            return message.reply(`You don't have permission to access this command.`);
        }

        // Depending on the delivery method, do stuff
        let sendMessage = () => { };
        let done = false;
        let typing = false;
        if (!done && command.supportedDeliveryTypes.includes('mention')) {
            // 1) Mention people

            // Filter out ourselves
            const mentions = message.mentions.users.filterArray(u => u.id !== this.bot.getClient().user.id);
            if (mentions.length === 0 && command.supportedDeliveryTypes.length === 1) {
                // There are no mentions and only mentioning is possible
                return message.reply(`For this command to work, you have to mention someone with the '@' symbol, like ${this.bot.getClient().user}.`);
            } else if (mentions.length > 0) {
                // There are mentions, let's proceed
                sendMessage = (mentions => {
                    return response => response ? message.channel.sendMessage(`${mentions}, ${response}`) : null;
                })(mentions.join(' '));
                done = true;
                typing = true;
            }
        }
        if (!done && command.supportedDeliveryTypes.includes('text')) {
            // 2) Reply directly to the command executor in the same channel
            sendMessage = response => response ? message.reply(response) : null;
            done = true;
            typing = true;
        }
        if (!done && command.supportedDeliveryTypes.includes('dm')) {
            // 3) Reply by DM
            sendMessage = response => response ? message.author.sendMessage(response) : null;
            done = true;
            typing = message.channel.type === 'dm';
        }

        // Do stuff
        if (done) {
            if (typing) {
                message.channel.startTyping();
            }
            return Promise.try(() => command.onCommand(message, params))
                .then(response => {
                    // Update command cooldowns upon successful command execution
                    this.updateCommandCooldowns(message, command);
                    return response;
                })
                .catch(err => {
                    if (err.name === 'CommandError') {
                        console.log(`Caught CommandError on '${message.content}' by '${message.author.username}#${message.author.discriminator}': ${err.message}`);
                        return err.message;
                    } else {
                        console.warn(`Unexpected error on '${message.content}' by '${message.author.username}#${message.author.discriminator}': ${err.message}`);
                        console.warn(err.stack);
                        return `Failed to execute command: ${err.message}`;
                    }
                })
                .finally(() => {
                    if (typing) {
                        message.channel.stopTyping();
                    }
                }).then(sendMessage);
        }
    }

    parseCommandString(message) {
        const messageMatch = message.content.match(new RegExp(`^${config.get('discord.command_prefix')}([^\\s]*)(\\s+(.*))?$`));
        // If there's no likely command match, we return nothing
        if (!messageMatch) {
            return [null, null];
        }
        const name = messageMatch[1].toLowerCase();
        const command = this.commands.find(command => command.name === name);

        // If the command is empty, we return nothing
        if (!command) {
            return [null, null];
        }

        let params = [];
        if (messageMatch[3]) {
            const spl = messageMatch[3].split(' ');
            params = spl.splice(0, command.params.length - 1);
            params.push(spl.join(' '));
        }
        // If the parameter count does not line up, we return nothing
        if (params.length < command.params.filter(param => !param.isOptional).length) {
            return [null, null];
        }

        // Return the parsed command with parameters
        return [command, params];
    }

    checkCommandChannelType(message, command) {
        return command.listenChannelTypes.includes(message.channel.type);
    }

    checkCommandChannel(message, command) {
        // If the channels array is empty, all channels are allowed
        return command.listenChannels.length === 0 || command.listenChannels.includes(message.channel.id);
    }

    getCommandCooldownCacheName(message, command) {
        return command.cooldownType === 'user' ? `command-cooldown-${command.name}-${message.author.id}` : `command-cooldown-${command.name}`;
    }

    getUserCooldownCacheName(message) {
        return `user-cooldown-${message.author.id}`;
    }

    checkCommandCooldowns(message, command) {
        if (command.cooldownType !== 'none') {
            const commandCooldownCacheName = this.getCommandCooldownCacheName(message, command);
            const commandCooldown = cache.get(commandCooldownCacheName);
            if (commandCooldown) {
                if (!commandCooldown.warning) {
                    cache.set(commandCooldownCacheName, { warning: true }, (cache.getTtl(commandCooldownCacheName) - Date.now()) / 1000);
                    return `warn-command-${command.cooldown}`;
                }
                return false;
            }
            const userCooldownCacheName = this.getUserCooldownCacheName(message);
            const userCooldown = cache.get(userCooldownCacheName);
            if (userCooldown) {
                if (!userCooldown.warning) {
                    cache.set(userCooldownCacheName, { warning: true }, (cache.getTtl(userCooldownCacheName) - Date.now()) / 1000);
                    return `warn-user`;
                }
                return false;
            }
        }
        return true;
    }

    updateCommandCooldowns(message, command) {
        if (command.cooldownType !== 'none') {
            cache.set(this.getCommandCooldownCacheName(message, command), {}, config.get('discord.command_cooldown'));
            cache.set(this.getUserCooldownCacheName(message), {}, config.get('discord.user_cooldown'));
        }
    }

    isPermissionInList(list, command) {
        return list.some(p => command.match(new RegExp(`^${p.replace('.', '\\.').replace('*', '.*')}$`)));
    }

    checkCommandPermission(message, command) {
        const permissions = config.get('permissions');
        let commandAllowed;
        for (let name in permissions) {
            if (permissions.hasOwnProperty(name)) {
                // Check for each permission group to see if the user is added as a user or as a role
                const group = permissions[name];
                if ((group.user_ids && group.user_ids.indexOf(message.author.id) > -1) ||
                    (message.member && group.role_ids && _.intersection(group.role_ids, message.member.roles.keyArray()).length > 0)) {
                    if (this.isPermissionInList(group.blacklist, command.permissionId)) {
                        // Command explicitly disallowed
                        commandAllowed = false;
                        break;
                    } else if (this.isPermissionInList(group.whitelist, command.permissionId)) {
                        // Command explicitly allowed
                        commandAllowed = true;
                        break;
                    }
                }
            }
        }
        if (commandAllowed === undefined) {
            // Check default group
            if (permissions.default.blacklist.length > 0) {
                // Check blacklist
                commandAllowed = !this.isPermissionInList(permissions.default.blacklist, command.permissionId);
            } else if (permissions.default.whitelist.length > 0) {
                // Check whitelist
                commandAllowed = this.isPermissionInList(permissions.default.whitelist, command.permissionId);
            } else {
                // Blacklist and whitelist are empty, assume allow
                commandAllowed = true;
            }
        }
        return commandAllowed;
    }
}

module.exports = ModuleBase;
