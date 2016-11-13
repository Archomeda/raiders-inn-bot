'use strict';

class CommandResponse {
    constructor(message, command, params) {
        this._message = message;
        this._command = command;
        this._params = params;

        this.breakMiddleware = false;
        this.mentions = [message.author];
        this.replyText = null;
        this.replyFunc = message.channel.sendMessage.bind(message.channel);
        this.startTypingFunc = message.channel.startTyping.bind(message.channel);
        this.stopTypingFunc = message.channel.stopTyping.bind(message.channel);
    }

    get message() {
        return this._message;
    }

    get command() {
        return this._command;
    }

    get params() {
        return this._params;
    }
}

module.exports = CommandResponse;
