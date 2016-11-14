'use strict';

const
    Command = require('../Command'),
    MentionsMiddleware = require('../../middleware/MentionsMiddleware'),
    RestrictChannelsMiddleware = require('../../middleware/RestrictChannelsMiddleware');

class CommandWelcome extends Command {
    constructor(module, commandConfig) {
        super(module, commandConfig);

        this.id = 'welcome';
        this.helpText = 'Welcomes people to the server and directs them to the read-first channel.';
        this.shortHelpText = 'Welcomes people to the server';

        this.middleware = [
            new RestrictChannelsMiddleware({ types: 'text' }),
            new MentionsMiddleware({ types: 'mention' })
        ];
    }

    onCommand(response) {
        const welcomeChannel = response.message.guild.channels.get(this.config.get.target_channel);
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
