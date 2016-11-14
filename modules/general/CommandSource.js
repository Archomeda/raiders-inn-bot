'use strict';

const
    Command = require('../Command'),
    MentionsMiddleware = require('../../middleware/MentionsMiddleware');

class CommandSource extends Command {
    constructor(module, commandConfig) {
        super(module, commandConfig);

        this.id = 'source';
        this.helpText = 'Shows the link to the source code of this bot.';
        this.shortHelpText = 'Shows the link to the source code of this bot';

        this.middleware = new MentionsMiddleware({ types: ['reply', 'mention'] });
    }

    onCommand(response) {
        return 'You can find the source code at https://github.com/Archomeda/raiders-inn-bot.';
    }
}

module.exports = CommandSource;
