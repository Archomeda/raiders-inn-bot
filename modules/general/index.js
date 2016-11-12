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

        this.registerCommand(new CommandHelp(this));
        this.registerCommand(new CommandSource(this));
        this.registerCommand(new CommandWelcome(this));
        this.registerCommand(new CommandWiki(this));
    }
}

module.exports = ModuleGeneral;
