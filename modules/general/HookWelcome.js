'use strict';

const
    i18next = require('i18next'),

    DiscordHook = require('../DiscordHook');

class HookWelcome extends DiscordHook {
    constructor(module) {
        super(module);
        i18next.loadNamespaces('general');

        this._hooks = {
            guildMemberAdd: this.onGuildMemberAdd
        };
    }

    welcome(member) {
        try {
            const welcomeChannel = member.guild.channels.get(this.config.channel);
            const targetChannel = member.guild.channels.get(this.config.target_channel);
            welcomeChannel.sendMessage(i18next.t('general:welcome.message', { member: member.toString(), target_channel: targetChannel.toString() }));
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
