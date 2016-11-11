'use strict';

const
    config = require('config'),

    CommandBase = require('../command-base');

class CommandSource extends CommandBase {
    constructor(module) {
        super(module);

        this.id = 'source';
        this.name = config.get('modules.general.command_source');
        this.helpText = 'Shows the link to the source code of this bot.';
        this.shortHelpText = 'Shows the link to the source code of this bot';
    }

    onCommand(message, params) {
        return 'You can find the source code at https://github.com/Archomeda/raiders-inn-bot.';
    }
}

module.exports = CommandSource;
