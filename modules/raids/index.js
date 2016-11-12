'use strict';

const
    ModuleBase = require('../module-base'),
    CommandResetTime = require('./command-reset-time');

class ModuleRaids extends ModuleBase {
    constructor(bot) {
        super(bot);

        this._commands = [
            new CommandResetTime(this)
        ];
    }
}

module.exports = ModuleRaids;
