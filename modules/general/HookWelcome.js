'use strict';

const
    DiscordHook = require('../DiscordHook');

class HookWelcome extends DiscordHook {
    constructor(module) {
        super(module);

        this._hooks = {
            guildMemberAdd: this.onGuildMemberAdd
        };
    }

    welcome(member) {
        try {
            const welcomeChannel = member.guild.channels.get(this.config.channel);
            const targetChannel = member.guild.channels.get(this.config.target_channel);
            welcomeChannel.sendMessage(
                `${member} has joined The Raiders Inn! Welcome! 
                Be sure to head over to ${targetChannel} to get started. 
                You will find our rules and general information there. 
                Don't forget to assign yourself to a server!\n\n
                Enjoy your stay! :beers:`
            );
        } catch (err) {
            console.warn(`Caught error: ${err.message}`);
            console.warn(err.stack);
        }
    }

    onGuildMemberAdd(member) {
        this.welcome(member);
    }
}

module.exports = HookWelcome;
