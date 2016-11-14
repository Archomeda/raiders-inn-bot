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
            const channelName = response.message.channel.name ? response.message.channel.name : response.message.channel.type;
            throw new MiddlewareError(`Wrong channel for command (command: ${response.command.trigger}, channel: #${channelName})`, 'log');
        }
        return response;
    }
}

module.exports = RestrictChannelsMiddleware;
