'use strict';

const
    Module = require('../Module'),
    CommandResetTime = require('./CommandResetTime');

class ModuleRaids extends Module {
    constructor(bot) {
        super(bot);

        this._commands = [
            new CommandResetTime(this)
        ];
    }
}

module.exports = ModuleRaids;
