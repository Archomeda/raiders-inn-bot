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
            channels: [],
            customFunc: null
        };
        this.options = Object.assign({}, defaultOptions, options);
        this.options.types = ensureArray(this.options.types);
        this.options.channels = ensureArray(this.options.channels);
    }

    onCommand(obj) {
        let allowed = true;
        allowed = allowed && this.options.types.includes(obj.message.channel.type);
        allowed = allowed && (this.options.channels.length === 0 || this.options.channels.includes(obj.message.channel.id));
        if (allowed && this.options.customFunc) {
            allowed = this.options.customFunc(obj.message, obj.command, obj.params);
        }
        if (allowed) {
            return this.nextCommand(obj);
        }
        const channelName = obj.message.channel.name ? obj.message.channel.name : obj.message.channel.type;
        throw new MiddlewareError(`Wrong channel for command (command: ${obj.command.name}, channel ${channelName})`, 'log');
    }
}

module.exports = RestrictChannelsMiddleware;
