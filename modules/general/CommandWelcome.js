'use strict';

const
    Promise = require('bluebird'),
    i18next = Promise.promisifyAll(require('i18next')),

    Command = require('../Command'),
    ReplyToMentionedUsersMiddleware = require('../../middleware/ReplyToMentionedUsersMiddleware'),
    RestrictChannelsMiddleware = require('../../middleware/RestrictChannelsMiddleware');

class CommandWelcome extends Command {
    constructor(module) {
        super(module);
        i18next.loadNamespacesAsync('general').then(() => {
            this.helpText = i18next.t('general:welcome.help');
            this.shortHelpText = i18next.t('general:welcome.short-help');
        });

        this.middleware = [
            new RestrictChannelsMiddleware({ types: 'text' }),
            new ReplyToMentionedUsersMiddleware({ strict: true })
        ];
    }

    onCommand(response) {
        const welcomeChannel = response.message.guild.channels.get(this.config.target_channel);
        return i18next.t('general:welcome.response', { welcome_channel: welcomeChannel.toString() });
    }
}

module.exports = CommandWelcome;
