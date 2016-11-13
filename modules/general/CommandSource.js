'use strict';

const
    config = require('config'),

    Command = require('../Command'),
    MentionsMiddleware = require('../../middleware/MentionsMiddleware');

class CommandSource extends Command {
    constructor(module) {
        super(module);

        this.id = 'source';
        this.name = config.get('modules.general.command_source');
        this.helpText = 'Shows the link to the source code of this bot.';
        this.shortHelpText = 'Shows the link to the source code of this bot';

        this.middleware = new MentionsMiddleware({ types: ['reply', 'mention'] });
    }

    onCommand(message, params) {
        return 'You can find the source code at https://github.com/Archomeda/raiders-inn-bot.';
    }
}

module.exports = CommandSource;
