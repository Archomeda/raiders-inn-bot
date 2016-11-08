'use strict';

const
    config = require('config'),
    Promise = require('bluebird');

class BaseModule {
    constructor(bot, config) {
        this.bot = bot;
        this.config = config;

        this.commands = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
            .filter(name => name.startsWith('cmd_'))
            .map(command => this[command]());

        this.bot.getClient().on('message', message => this.on_message(message));
    }

    on_message(message) {
        const match = message.content.match(new RegExp(`^${config.get('discord.command-prefix')}([^\\s]*)(\\s+(.*))?$`));
        if (!match) return;

        const commandId = match[1].toLowerCase();
        const command = this.commands.find(command => command.id == commandId);

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
        const deliver = command.deliver || 'text';

        if (deliver === 'text') {
            message.channel.startTyping();
            return Promise.try(() => command.on_command(message, commandParams))
                .catch(err => {
                    console.warn(`Executing command '${message.content}' by '${message.author.username}#${message.author.discriminator}' failed: ${err.message}`);
                    console.warn(err.stack);
                    return `Command execution failed: ${err.message}`;
                })
                .finally(() => message.channel.stopTyping())
                .then(response => message.reply(response));
        } else if (deliver === 'dm') {
            return Promise.try(() => command.on_command(message, commandParams))
                .catch(err => {
                    console.warn(`Executing command '${message.content}' by '${message.author.username}#${message.author.discriminator}' failed: ${err.message}`);
                    console.warn(err.stack);
                    return `Command execution failed: ${err.message}`;
                })
                .then(response => message.author.sendMessage(response));
        }
    }
}

module.exports = BaseModule;
