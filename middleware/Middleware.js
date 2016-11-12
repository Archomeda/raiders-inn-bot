'use strict';

class Middleware {
    constructor() {
        if (new.target === Middleware) {
            throw new TypeError('cannot construct Middleware instances directly');
        }
        this.name = this.constructor.name;
    }

    onCommand(obj) {
        throw new TypeError('must override method');
    }

    nextCommand(obj) {
        return {
            message: obj.message,
            command: obj.command,
            params: obj.params,
            _next: true
        };
    }

    onResponse(obj) {
        return this.nextResponse(obj);
    }

    nextResponse(obj) {
        return {
            message: obj.message,
            command: obj.command,
            params: obj.params,
            response: obj.response,
            _next: true
        };
    }
}

module.exports = Middleware;
