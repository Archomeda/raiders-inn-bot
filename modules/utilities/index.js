'use strict';

const
    ModuleBase = require('../Module'),
    CommandRoll = require('./CommandRoll');

class ModuleUtilities extends ModuleBase {
    constructor(bot) {
        super(bot);

        this._commands = [
            new CommandRoll(this)
        ];
    }
}

module.exports = ModuleUtilities;
