'use strict';

const
    ModuleBase = require('../module-base'),
    CommandHelp = require('./command-help'),
    CommandSource = require('./command-source'),
    CommandWelcome = require('./command-welcome'),
    CommandWiki = require('./command-wiki');

class ModuleGeneral extends ModuleBase {
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
