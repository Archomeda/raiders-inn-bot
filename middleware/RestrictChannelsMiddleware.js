'use strict';

const
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
        if (typeof this.options.channels !== 'function') {
            this.options.channels = ensureArray(this.options.channels);
        }
    }

    onCommand(response) {
        let allowed = true;
        allowed = allowed && this.options.types.includes(response.message.channel.type);
        let channels = this.options.channels;
        if (typeof channels === 'function') {
            channels = channels(response.message, response.command, response.params);
        }
        allowed = allowed && channels && (channels.length === 0 || channels.includes(response.message.channel.id));
        if (!allowed) {
            const channelName = response.message.channel.name ? response.message.channel.name : response.message.channel.type;
            throw new MiddlewareError(`Wrong channel for command (command: ${response.command.name}, channel: #${channelName})`, 'log');
        }
        return response;
    }
}

module.exports = RestrictChannelsMiddleware;
