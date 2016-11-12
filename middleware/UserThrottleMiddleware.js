'use strict';

const
    NodeCache = require('node-cache'),

    Middleware = require('./Middleware'),
    MiddlewareError = require('../errors/MiddlewareError');

const cache = new NodeCache();

class UserThrottleMiddleware extends Middleware {
    constructor(options) {
        super(Middleware);
        const defaultOptions = {
            duration: 2
        };
        this.options = Object.assign({}, defaultOptions, options);
    }

    onCommand(obj) {
        const cacheName = `throttle-${obj.message.author.id}`;
        const allowed = !cache.get(cacheName);
        if (allowed) {
            cache.set(cacheName, {}, this.options.duration);
            return this.nextCommand(obj);
        }
        throw new MiddlewareError(`User has been throttled (command: ${obj.command.name}, user: ${obj.message.author.username}#${obj.message.author.discriminator})`, 'log');
    }
}

module.exports = UserThrottleMiddleware;
