'use strict';

const
    NodeCache = require('node-cache'),

    Middleware = require('./Middleware'),
    MiddlewareError = require('../errors/MiddlewareError');

const cache = new NodeCache();

class UserThrottleMiddleware extends Middleware {
    constructor(options) {
        super(options);
        const defaultOptions = {
            duration: 2
        };
        this.options = Object.assign({}, defaultOptions, options);
    }

    onCommand(response) {
        const cacheName = `throttle-${response.message.author.id}`;
        if (cache.get(cacheName)) {
            const username = `${response.message.author.username}#${response.message.author.discriminator}`;
            throw new MiddlewareError(`User has been throttled (command: ${this.name}, user: ${username})`, 'log');
        }
        cache.set(cacheName, {}, this.options.duration);
        return response;
    }
}

module.exports = UserThrottleMiddleware;
