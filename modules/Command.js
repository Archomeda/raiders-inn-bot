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
        // TODO: change the supported delivery types to something else (middleware maybe?)
        this._supportedDeliveryTypes = ['text'];
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

    get cooldownType() {
        return this._cooldownType;
    }
    set cooldownType(type) {
        if (!new Set(['global', 'user', 'none']).has(type)) {
            throw new TypeError('type is not global, user or none');
        }
        this._cooldownType = type;
    }

    get supportedDeliveryTypes() {
        return this._supportedDeliveryTypes;
    }
    set supportedDeliveryTypes(types) {
        if (!types) {
            throw new TypeError('types cannot be null or undefined');
        }
        types = ensureArray(types);
        types = _.intersection(types, ['dm', 'text', 'mention']);
        if (types.length === 0) {
            throw new TypeError('types is empty or contained only incompatible types');
        }
        this._supportedDeliveryTypes = types;
    }

    get listenChannels() {
        return this._listenChannels;
    }
    set listenChannels(channels) {
        this._listenChannels = ensureArray(channels);
    }

    get listenChannelTypes() {
        return this._listenChannelTypes;
    }
    set listenChannelTypes(types) {
        if (!types) {
            throw new TypeError('types cannot be null or undefined');
        }
        types = ensureArray(types);
        types = _.intersection(types, ['dm', 'text']);
        if (types.length === 0) {
            throw new TypeError('types is empty or contained only incompatible types');
        }
        this._listenChannelTypes = types;
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
