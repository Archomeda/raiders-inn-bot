'use strict';

const
    Module = require('../Module'),
    CommandHelp = require('./CommandHelp'),
    CommandSource = require('./CommandSource'),
    CommandWelcome = require('./CommandWelcome'),
    CommandWiki = require('./CommandWiki');

class ModuleGeneral extends Module {
    constructor(bot) {
        super(bot);

        this._commands = [
            new CommandHelp(this),
            new CommandSource(this),
            new CommandWelcome(this),
            new CommandWiki(this)
        ];
    }
}

module.exports = ModuleGeneral;
