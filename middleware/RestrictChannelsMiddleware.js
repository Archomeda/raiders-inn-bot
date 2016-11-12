'use strict';

const
    Middleware = require('./Middleware'),
    MiddlewareError = require('../errors/MiddlewareError'),
    ensureArray = require('../utils/array').ensureArray;

class RestrictChannelsMiddleware extends Middleware {
    constructor(options) {
        super(Middleware);
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

    onCommand(obj) {
        let allowed = true;
        allowed = allowed && this.options.types.includes(obj.message.channel.type);
        let channels = this.options.channels;
        if (typeof channels === 'function') {
            channels = channels(obj.message, obj.command, obj.params);
        }
        allowed = allowed && channels && (channels.length === 0 || channels.includes(obj.message.channel.id));
        if (allowed) {
            return this.nextCommand(obj);
        }
        const channelName = obj.message.channel.name ? obj.message.channel.name : obj.message.channel.type;
        throw new MiddlewareError(`Wrong channel for command (command: ${obj.command.name}, channel: #${channelName})`, 'log');
    }
}

module.exports = RestrictChannelsMiddleware;
