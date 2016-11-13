'use strict';

class Middleware {
    constructor() {
        if (new.target === Middleware) {
            throw new TypeError('cannot construct Middleware instances directly');
        }
        this.name = this.constructor.name;
    }

    onCommand(response) {
        throw new TypeError('must override method');
    }

    onResponse(response) {
        return response;
    }
}

module.exports = Middleware;
