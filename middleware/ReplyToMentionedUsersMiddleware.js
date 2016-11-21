'use strict';

const
    Middleware = require('./Middleware'),
    MiddlewareError = require('../errors/MiddlewareError');

class ReplyToMentionedUsersMiddleware extends Middleware {
    constructor(options) {
        super(options);
        const defaultOptions = {
            strict: false
        };
        this.options = Object.assign({}, defaultOptions, options);
    }

    onCommand(response) {
        if (this.options.strict && response.mentions.length === 0) {
            const username = `${response.message.author.username}#${response.message.author.discriminator}`;
            const channelName = response.message.channel.name ? response.message.channel.name : response.message.channel.type;
            throw new MiddlewareError(
                `No mentions given for command (user ${username}, command: ${response.command.trigger}, channel: #${channelName})`,
                'log',
                'For this command to work, you have to `@mention` people.'
            );
        }
        if (response.mentions.length > 0) {
            response.replyTo = response.mentions;
        }
        return response;
    }
}

module.exports = ReplyToMentionedUsersMiddleware;
