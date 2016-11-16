'use strict';

const
    Module = require('../Module'),
    CommandRoll = require('./CommandRoll');

class ModuleUtilities extends Module {
    constructor(bot, moduleConfig) {
        super(bot, moduleConfig);

        this.registerCommand(new CommandRoll(this));
    }
}

module.exports = ModuleUtilities;
