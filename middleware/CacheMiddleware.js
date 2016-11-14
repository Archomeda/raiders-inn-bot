'use strict';

const
    NodeCache = require('node-cache'),

    Middleware = require('./Middleware'),
    MiddlewareError = require('../errors/MiddlewareError');

const cache = new NodeCache();

class CacheMiddleware extends Middleware {
    constructor(options) {
        super(options);
        const defaultOptions = {
            duration: 5 * 60
        };
        this.options = Object.assign({}, defaultOptions, options);
    }

    onCommand(response) {
        const cachedObj = cache.get(this.getCacheName(response.command, response.params));
        if (cachedObj) {
            response.replyText = cachedObj.text;
            response.breakMiddleware = true;
        }
        return response;
    }

    onResponse(response) {
        cache.set(this.getCacheName(response.command, response.params), { text: response.replyText }, this.options.duration);
        return response;
    }

    getCacheName(command, params) {
        return `${command} ${params.join(' ')}`;
    }
}

module.exports = CacheMiddleware;
