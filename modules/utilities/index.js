'use strict';

const
    ModuleBase = require('../Module'),
    CommandRoll = require('./CommandRoll');

class ModuleUtilities extends ModuleBase {
    constructor(bot, moduleConfig) {
        super(bot, moduleConfig);

        this.registerCommand(new CommandRoll(this, moduleConfig.commands.roll));
    }
}

module.exports = ModuleUtilities;
