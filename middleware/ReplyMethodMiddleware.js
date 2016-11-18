'use strict';

const
    Middleware = require('./Middleware');

class ReplyMethodMiddleware extends Middleware {
    constructor(options) {
        super(options);
        const defaultOptions = {
            method: null,
        };
        this.options = Object.assign({}, defaultOptions, options);
    }

    onCommand(response) {
        switch (this.options.method) {
            case 'dm':
                response.replyFunc = response.message.author.sendMessage.bind(response.message.author);
                response.replyMethod = 'dm';
                if (response.message.channel.type === 'dm') {
                    response.startTypingFunc = response.message.channel.startTyping.bind(response.message.channel);
                    response.stopTypingFunc = response.message.channel.stopTyping.bind(response.message.channel);
                } else {
                    response.startTypingFunc = null;
                    response.stopTypingFunc = null;
                }
                break;
            default:
                if (this.options.method) {
                    // Assume we have a channel id instead
                    const channel = response.message.guild.channels.get(this.options.channel);
                    response.replyFunc = channel.sendMessage.bind(channel);
                    response.startTypingFunc = channel.startTyping.bind(channel);
                    response.stopTypingFunc = channel.stopTyping.bind(channel);
                }
                break;
        }
        return response;
    }
}

module.exports = ReplyMethodMiddleware;
