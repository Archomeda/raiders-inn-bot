'use strict';

const
    Module = require('../Module'),
    CommandHelp = require('./CommandHelp'),
    CommandSource = require('./CommandSource'),
    CommandWelcome = require('./CommandWelcome'),
    CommandWiki = require('./CommandWiki');

class ModuleGeneral extends Module {
    constructor(bot, moduleConfig) {
        super(bot, moduleConfig);

        this.registerCommand(new CommandHelp(this));
        this.registerCommand(new CommandSource(this));
        this.registerCommand(new CommandWelcome(this));
        this.registerCommand(new CommandWiki(this));
    }
}

module.exports = ModuleGeneral;
