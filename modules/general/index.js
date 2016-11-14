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

        this.registerCommand(new CommandHelp(this, moduleConfig.commands.help));
        this.registerCommand(new CommandSource(this, moduleConfig.commands.source));
        this.registerCommand(new CommandWelcome(this, moduleConfig.commands.welcome));
        this.registerCommand(new CommandWiki(this, moduleConfig.commands.wiki));
    }
}

module.exports = ModuleGeneral;
