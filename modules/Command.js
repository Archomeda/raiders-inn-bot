'use strict';

const
    config = require('config'),
    snakeCase = require('change-case').snakeCase,

    ensureArray = require('../utils/array').ensureArray;

class Command {
    constructor(module) {
        if (new.target === Command) {
            throw new TypeError('cannot construct Command instances directly');
        }

        this._module = module;

        this.id = snakeCase(new.target.name.replace(/(.*?)(Command)?/, '$1'));
        this.trigger = null;
        this._config = this._module.config.commands[this.id];
        // TODO: implement aliases support in modules
        this._aliases = [];
        this.helpText = null;
        this.shortHelpText = null;
        this._params = [];

        this._defaultMiddleware = [];
        this._middleware = [];
    }

    toString() {
        return `${config.get('discord.command_prefix')}${this.trigger}`;
    }

    onCommand(response) {
        throw new TypeError('must override method');
    }

    get module() {
        return this._module;
    }

    get config() {
        return this._config;
    }

    get permissionId() {
        return `${snakeCase(this._module.name)}.${this.id}`;
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

    get allMiddleware() {
        return this._defaultMiddleware.concat(this._middleware);
    }
    get defaultMiddleware() {
        return this._defaultMiddleware;
    }
    set defaultMiddleware(middleware) {
        this._defaultMiddleware = ensureArray(middleware);
    }
    get middleware() {
        return this._middleware;
    }
    set middleware(middleware) {
        this._middleware = ensureArray(middleware);
    }
}

module.exports = Command;
