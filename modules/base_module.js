'use strict';

const
    _ = require('lodash'),
    config = require('config'),
    NodeCache = require('node-cache'),
    Promise = require('bluebird');

const cache = new NodeCache();

class BaseModule {
    constructor(bot, config, filename) {
        this.bot = bot;
        this.config = config;
        this.filename = filename;

        this.commands = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
            .filter(name => name.startsWith('cmd_'))
            .map(command => {
                let commandObject = this[command]();
                // Check if commands are sane
                if (!commandObject.id || !commandObject.command) {
                    throw new Error(`Command ${command} is either missing the id or command property.`);
                }

                // Set some default values
                commandObject.permissionId = `${this.filename}.${commandObject.id}`;
                if (!commandObject.deliver) {
                    commandObject.deliver = ['text'];
                } else if (!Array.isArray(commandObject.deliver)) {
                    commandObject.deliver = [commandObject.deliver];
                }
                if (!commandObject.cooldown) {
                    commandObject.cooldown = 'global';
                }
                if (!commandObject.channels) {
                    commandObject.channels = [];
                } else if (!Array.isArray(commandObject.channels)) {
                    commandObject.channels = [commandObject.channels];
                }
                if (!commandObject.channel_type) {
                    commandObject.channel_type = ['dm', 'text'];
                } else if (!Array.isArray(commandObject.channel_type)) {
                    commandObject.channel_type = [commandObject.channel_type];
                }
                if (!commandObject.params) {
                    commandObject.params = [];
                }
                return commandObject;
            });

        this.bot.getClient().on('message', message => this.on_message(message));
    }

    parseCommandString(message) {
        const messageMatch = message.content.match(new RegExp(`^${config.get('discord.command_prefix')}([^\\s]*)(\\s+(.*))?$`));
        // If there's no likely command match, we return nothing
        if (!messageMatch) {
            return [null, null];
        }
        const name = messageMatch[1].toLowerCase();
        const command = this.commands.find(command => command.command === name);

        // If the command is empty, we return nothing
        if (!command) {
            return [null, null];
        }

        let params = [];
        if (command.params) {
            params = [];
            if (messageMatch[3]) {
                const spl = messageMatch[3].split(' ');
                params = spl.splice(0, command.params.length - 1);
                params.push(spl.join(' '));
            }
            // If the parameter count does not line up, we return nothing
            if (params.length < command.params.filter(param => !param.optional).length) {
                return [null, null];
            }
        }

        // Return the parsed command with parameters
        return [command, params];
    }

    checkCommandChannelType(message, command) {
        return command.channel_type.indexOf(message.channel.type) > -1;
    }

    checkCommandChannel(message, command) {
        // If the channels array is empty, all channels are allowed
        return command.channels.length === 0 || command.channels.indexOf(message.channel.id) > -1;
    }

    getCommandCooldownCacheName(message, command) {
        return command.cooldown === 'user' ? `command-cooldown-${command.id}-${message.author.id}` : `command-cooldown-${command.id}`;
    }

    getUserCooldownCacheName(message) {
        return `user-cooldown-${message.author.id}`;
    }

    checkCommandCooldowns(message, command) {
        if (command.cooldown !== 'none') {
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
        if (command.cooldown !== 'none') {
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

    on_message(message) {
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
                return message.reply("You've already executed this command recently. Please wait a bit before executing it again.");
            case 'warn-user':
                return message.reply("You've already executed a command recently. Please wait a bit before executing another.");
            case false:
                return;
        }

        // If the user does not have the correct permissions, we warn the user
        if (!this.checkCommandPermission(message, command)) {
            return message.reply("You don't have permission to access this command.");
        }

        // Depending on the delivery method, do stuff
        let sendMessage = () => { };
        let done = false;
        let typing = false;
        if (!done && command.deliver.indexOf('mention') > -1) {
            // 1) Mention people

            // Filter out ourselves
            const mentions = message.mentions.users.filterArray(u => u.id !== this.bot.getClient().user.id);
            if (mentions.length === 0 && command.deliver.length === 1) {
                // There are no mentions and only mentioning is possible
                return message.reply(`For this command to work, you have to mention someone with the '@' symbol, like ${this.bot.getClient().user}.`);
            } else if (mentions.length > 0) {
                // There are mentions, let's proceed
                sendMessage = (mentions => {
                    return response => {
                        if (response) {
                            return message.channel.sendMessage(`${mentions}, ${response}`);
                        }
                    };
                })(mentions.join(' '));
                done = true;
                typing = true;
            }
        }
        if (!done && command.deliver.indexOf('text') > -1) {
            // 2) Reply directly to the command executor in the same channel
            sendMessage = response => {
                if (response) {
                    return message.reply(response);
                }
            };
            done = true;
            typing = true;
        }
        if (!done && command.deliver.indexOf('dm') > -1) {
            // 3) Reply by DM
            sendMessage = response => {
                if (response) {
                    return message.author.sendMessage(response);
                }
            };
            done = true;
            typing = message.channel.type === 'dm';
        }

        // Do stuff
        if (done) {
            if (typing) {
                message.channel.startTyping();
            }
            return Promise.try(() => command.on_command(message, params))
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
}

module.exports = BaseModule;
