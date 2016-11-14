'use strict';

const
    _ = require('lodash'),

    ensureArray = require('../utils/array').ensureArray;

class Command {
    constructor(module) {
        if (new.target === Command) {
            throw new TypeError('cannot construct Command instances directly');
        }

        this._module = module;

        this.id = null;
        this.name = null;
        // TODO: implement aliases support in modules
        this._aliases = [];
        this.helpText = null;
        this.shortHelpText = null;
        this._params = [];

        this._defaultMiddleware = [];
        this._middleware = [];
    }

    onCommand(message, params) {
        throw new TypeError('must override method');
    }

    get module() {
        return this._module;
    }

    get permissionId() {
        return `${this._module.filename}.${this.id}`;
    }

    get aliases() {
        return this._aliases;
    }
    set aliases(aliases) {
        this._aliases = ensureArray(aliases);
    }

    get params() {
        return this._params;
    }
    set params(params) {
        params = ensureArray(params);
        this._params = params.filter(p => p.name);
    }

    get middleware() {
        return this._defaultMiddleware.concat(this._middleware);
    }
    set defaultMiddleware(middleware) {
        this._defaultMiddleware = ensureArray(middleware);
    }
    set middleware(middleware) {
        this._middleware = ensureArray(middleware);
    }
}

module.exports = Command;
