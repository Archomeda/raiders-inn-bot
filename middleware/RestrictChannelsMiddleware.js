'use strict';

const
    _ = require('lodash'),

    Middleware = require('./Middleware'),
    MiddlewareError = require('../errors/MiddlewareError'),
    ensureArray = require('../utils/array').ensureArray;

class RestrictChannelsMiddleware extends Middleware {
    constructor(options) {
        super(options);
        const defaultOptions = {
            types: ['text', 'dm'],
            channels: []
        };
        this.options = Object.assign({}, defaultOptions, options);
        this.options.types = ensureArray(this.options.types);
        this.options.channels = ensureArray(this.options.channels);
    }

    onCommand(response) {
        let allowed = true;
        allowed = allowed && this.options.types.includes(response.message.channel.type);
        let channels = _.flatten(
            this.options.channels.map(c => typeof c === 'function' ? c(response.message, response.command, response.params) : c)
        );
        allowed = allowed && channels && (channels.length === 0 || channels.includes(response.message.channel.id));
        if (!allowed) {
            let userMessage;
            if (response.message.guild) {
                const targetChannels = channels.map(c => {
                    const channel = response.message.guild.channels.get(c);
                    if (channel) {
                        return channel.toString();
                    }
                }).filter(c => c);
                userMessage = `This command only works in the following channels: ${targetChannels.join(' ')}.`;
            } else {
                userMessage = `This command does not work here.`;
            }
            const username = `${response.message.author.username}#${response.message.author.discriminator}`;
            const channelName = response.message.channel.name ? response.message.channel.name : response.message.channel.type;
            throw new MiddlewareError(
                `Wrong channel for command (user ${username}, command: ${response.command.trigger}, channel: #${channelName})`,
                'log',
                userMessage
            );
        }
        return response;
    }
}

module.exports = RestrictChannelsMiddleware;
