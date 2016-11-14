'use strict';

const
    Middleware = require('./Middleware'),
    MiddlewareError = require('../errors/MiddlewareError'),
    ensureArray = require('../utils/array').ensureArray;

class MentionsMiddleware extends Middleware {
    constructor(options) {
        super(options);
        const defaultOptions = {
            types: ['reply']
        };
        this.options = Object.assign({}, defaultOptions, options);
        this.options.types = ensureArray(this.options.types);
    }

    onCommand(response) {
        response.mentions = response.message.mentions.users.filterArray(u => u.id !== response.message.author.id && u.id !== response.message.client.user.id);
        const hasReply = this.options.types.includes('reply');
        const hasMention = this.options.types.includes('mention');
        if (hasReply && hasMention) {
            // Both replies and mentions are supported
            if (response.mentions.length === 0) {
                response.mentions = [response.message.author];
            }
        } else if (hasMention) {
            // Mentions are required
            if (response.mentions.length === 0) {
                const channelName = response.message.channel.name ? response.message.channel.name : response.message.channel.type;
                throw new MiddlewareError(
                    `No mentions given for command (command: ${response.command.trigger}, channel #${channelName})`,
                    'log',
                    'For this command to work, you have to `@mention` people.'
                );
            }
        } else if (hasReply) {
            // Just reply
            response.mentions = [response.message.author];
        }

        // Remove the mentioned users from the params
        const mentionRegex = response.mentions.map(m => new RegExp(`(\s+${m}|${m}|${m}\s+)`));
        response.params = response.params.map(p => {
            for (let regex of mentionRegex) {
                p = p.replace(regex, '');
            }
            return p;
        });
        return response;
    }
}

module.exports = MentionsMiddleware;
