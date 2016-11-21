'use strict';

class CommandResponse {
    constructor(message, command, params) {
        this.message = message;
        this.command = command;
        this.params = params.map(p => p.replace(/(\s+<@(\d+)>|<@(\d+)>|<@(\d+)>\s+)/, '')).filter(p => p);

        this.breakMiddleware = false;
        this.replyTo = [message.author];
        this.replyText = null;
        this.replyFunc = message.channel.sendMessage.bind(message.channel);
        this.startTypingFunc = message.channel.startTyping.bind(message.channel);
        this.stopTypingFunc = message.channel.stopTyping.bind(message.channel);

        // Filter mentions
        this.mentions = message.mentions.users.filterArray(u => u.id !== message.author.id && !u.bot);
    }
}

module.exports = CommandResponse;
