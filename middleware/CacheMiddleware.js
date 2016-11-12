'use strict';

const
    NodeCache = require('node-cache'),

    Middleware = require('./Middleware'),
    MiddlewareError = require('../errors/MiddlewareError');

const cache = new NodeCache();

class CacheMiddleware extends Middleware {
    constructor(options) {
        super(Middleware);
        const defaultOptions = {
            duration: 5 * 60
        };
        this.options = Object.assign({}, defaultOptions, options);
    }

    onCommand(obj) {
        const cachedObj = cache.get(this.getCacheName(obj.command, obj.params));
        if (cachedObj) {
            return cachedObj;
        }
        return this.nextCommand(obj);
    }

    onResponse(obj) {
        cache.set(this.getCacheName(obj.command, obj.params), { response: obj.response }, this.options.duration);
        return this.nextResponse(obj);
    }

    getCacheName(command, params) {
        return `${command} ${params.join(' ')}`;
    }
}

module.exports = CacheMiddleware;
