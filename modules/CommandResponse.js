'use strict';

class CommandResponse {
    constructor(message, command, params) {
        this.message = message;
        this.command = command;
        this.params = params;

        this.breakMiddleware = false;
        this.mentions = [message.author];
        this.replyText = null;
        this.replyFunc = message.channel.sendMessage.bind(message.channel);
        this.startTypingFunc = message.channel.startTyping.bind(message.channel);
        this.stopTypingFunc = message.channel.stopTyping.bind(message.channel);
    }
}

module.exports = CommandResponse;
