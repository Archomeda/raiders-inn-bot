'use strict';

const
    Module = require('../Module'),
    CommandResetTime = require('./CommandResetTime');

class ModuleRaids extends Module {
    constructor(bot, moduleConfig) {
        super(bot, moduleConfig);

        this.registerCommand(new CommandResetTime(this, moduleConfig.commands.reset_time));
    }
}

module.exports = ModuleRaids;
