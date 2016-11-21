'use strict';

const
    Command = require('../Command'),
    ReplyToMentionedUsersMiddleware = require('../../middleware/ReplyToMentionedUsersMiddleware'),
    RestrictChannelsMiddleware = require('../../middleware/RestrictChannelsMiddleware');

class CommandWelcome extends Command {
    constructor(module) {
        super(module);

        this.helpText = 'Welcomes people to the server and directs them to the read-first channel.';
        this.shortHelpText = 'Welcomes people to the server';

        this.middleware = [
            new RestrictChannelsMiddleware({ types: 'text' }),
            new ReplyToMentionedUsersMiddleware({ strict: true })
        ];
    }

    onCommand(response) {
        const welcomeChannel = response.message.guild.channels.get(this.config.target_channel);
        return (
            `Hey there {mentions}, welcome to The Raiders Inn! ` +
            `Be sure to head over to ${welcomeChannel} to get started. ` +
            'You will find our rules and general information there. ' +
            `Don't forget to assign yourself to a server!\n\n` +
            'Enjoy your stay! :beers:'
        );
    }
}

module.exports = CommandWelcome;
