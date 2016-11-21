'use strict';

const
    Command = require('../Command'),
    ReplyToMentionedUsersMiddleware = require('../../middleware/ReplyToMentionedUsersMiddleware');

class CommandSource extends Command {
    constructor(module) {
        super(module);

        this.helpText = 'Shows the link to the source code of this bot.';
        this.shortHelpText = 'Shows the link to the source code of this bot';

        this.middleware = new ReplyToMentionedUsersMiddleware();
    }

    onCommand(response) {
        return 'You can find the source code at https://github.com/Archomeda/raiders-inn-bot.';
    }
}

module.exports = CommandSource;
