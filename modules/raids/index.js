'use strict';

const
    Module = require('../Module'),
    CommandResetTime = require('./CommandResetTime');

class ModuleRaids extends Module {
    constructor(bot, moduleConfig) {
        super(bot, moduleConfig);

        this.registerCommand(new CommandResetTime(this));
    }
}

module.exports = ModuleRaids;
