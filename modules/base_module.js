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
        this.user_cooldowns = {};

        this.commands = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
            .filter(name => name.startsWith('cmd_'))
            .map(command => this[command]());

        this.bot.getClient().on('message', message => this.on_message(message));
    }

    checkPermissionRegex(list, command) {
        return list.some(p => command.match(new RegExp(`^${p.replace('.', '\\.').replace('*', '.*')}$`)));
    }

    checkPermission(message, command) {
        const permissions = config.get('permissions');
        let commandAllowed;
        for (let name in permissions) {
            if (permissions.hasOwnProperty(name)) {
                // Check for each permission group to see if the user is added as a user or as a role
                const group = permissions[name];
                if ((group.user_ids && group.user_ids.indexOf(message.author.id) > -1) ||
                    (message.member && group.role_ids && _.intersection(group.role_ids, message.member.roles.keyArray()).length > 0)) {
                    if (this.checkPermissionRegex(group.blacklist, command)) {
                        // Command explicitly disallowed
                        commandAllowed = false;
                        break;
                    } else if (this.checkPermissionRegex(group.whitelist, command)) {
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
                commandAllowed = !this.checkPermissionRegex(permissions.default.blacklist, command);
            } else if (permissions.default.whitelist.length > 0) {
                // Check whitelist
                commandAllowed = this.checkPermissionRegex(permissions.default.whitelist, command);
            } else {
                // Blacklist and whitelist are empty, assume allow
                commandAllowed = true;
            }
        }
        return commandAllowed;
    }

    on_message(message) {
        const match = message.content.match(new RegExp(`^${config.get('discord.command_prefix')}([^\\s]*)(\\s+(.*))?$`));
        if (!match) return;

        const commandName = match[1].toLowerCase();
        const command = this.commands.find(command => command.command == commandName);

        // Check for empty command
        if (!command) return;

        // Check for correct channel type
        let channelType = command.channel_type || ['dm', 'text'];
        if (!Array.isArray(channelType)) channelType = [channelType];
        if (channelType.indexOf(message.channel.type) === -1) return;

        // Check for correct channel(s)
        let channels = command.channels || [];
        if (!Array.isArray(channels)) channels = [channels];
        if (channels.length > 0 && channels.indexOf(message.channel.id) === -1) return;

        // Check for command cooldown
        const userId = message.author.id;
        const commandCooldownType = command.cooldown || 'user';
        let commandCooldownCacheName;
        if (commandCooldownType === 'user') {
            commandCooldownCacheName = `command-cooldown-${command.id}-${userId}`;
        } else if (commandCooldownType === 'global') {
            commandCooldownCacheName = `command-cooldown-${command.id}`;
        }
        const commandCooldown = cache.get(commandCooldownCacheName);
        if (commandCooldown) {
            if (!commandCooldown.warning) {
                cache.set(commandCooldownCacheName, { warning: true }, (cache.getTtl(commandCooldownCacheName) - Date.now()) / 1000);
                if (commandCooldownType === 'user') {
                    message.reply("You've already executed this command recently, please wait a bit before executing it again.");
                } else if (commandCooldownType === 'global') {
                    message.reply("This command has already been executed recently, please wait a bit before executing it again.");
                }
            }
            return;
        }

        // Check for user cooldown
        const userCooldownCacheName = `user-cooldown-${userId}`;
        const userCooldown = cache.get(userCooldownCacheName);
        if (userCooldown) {
            if (!userCooldown.warning) {
                cache.set(userCooldownCacheName, { warning: true }, (cache.getTtl(userCooldownCacheName) - Date.now()) / 1000);
                message.reply("You've already executed a command recently, please wait a bit before executing another.");
            }
            return;
        }

        // Check for correct permissions
        if (!this.checkPermission(message, `${this.filename}.${command.id}`)) {
            return message.reply("You don't have permission to access that command.");
        }

        // Set cooldowns
        cache.set(commandCooldownCacheName, { }, config.get('discord.command_cooldown'));
        cache.set(userCooldownCacheName, { }, config.get('discord.user_cooldown'));

        // Get parameters
        let commandParams = [];
        if (command.params) {
            commandParams = [];
            if (match[3]) {
                const spl = match[3].split(' ');
                commandParams = spl.splice(0, command.params.length - 1);
                commandParams.push(spl.join(' '));
            }
            if (commandParams.length < command.params.filter(param => !param.optional).length) return;
        }

        // Check what the deliver method is
        let deliver = command.deliver || 'text';

        if (deliver === 'mention') {
            if (message.mentions.users.size > 0) {
                message.channel.startTyping();
                return Promise.try(() => command.on_command(message, commandParams))
                    .catch(err => {
                        console.warn(`Executing command '${message.content}' by '${message.author.username}#${message.author.discriminator}' failed: ${err.message}`);
                        console.warn(err.stack);
                        return `Command execution failed: ${err.message}`;
                    })
                    .finally(() => message.channel.stopTyping())
                    .then(response => response ? message.channel.sendMessage(`${message.mentions.users.array().join(' ')}, ${response}`) : null);
            } else {
                deliver = 'text';
            }
        }

        if (deliver === 'text') {
            message.channel.startTyping();
            return Promise.try(() => command.on_command(message, commandParams))
                .catch(err => {
                    console.warn(`Executing command '${message.content}' by '${message.author.username}#${message.author.discriminator}' failed: ${err.message}`);
                    console.warn(err.stack);
                    return `Command execution failed: ${err.message}`;
                })
                .finally(() => message.channel.stopTyping())
                .then(response => response ? message.reply(response) : null);
        } else if (deliver === 'dm') {
            return Promise.try(() => command.on_command(message, commandParams))
                .catch(err => {
                    console.warn(`Executing command '${message.content}' by '${message.author.username}#${message.author.discriminator}' failed: ${err.message}`);
                    console.warn(err.stack);
                    return `Command execution failed: ${err.message}`;
                })
                .then(response => response ? message.author.sendMessage(response) : null);
        }
    }
}

module.exports = BaseModule;
