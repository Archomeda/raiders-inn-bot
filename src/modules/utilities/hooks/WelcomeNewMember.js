'use strict';

const DiscordHook = require('../../../../bot/modules/DiscordHook');


class HookWelcomeNewMember extends DiscordHook {
    constructor(bot) {
        super(bot, 'welcome-new-member');

        this._hooks = {
            guildMemberAdd: this.onNewMember.bind(this),
        };
    }

    async onNewMember(member) {
        if (!member || !member.guild) {
            return;
        }

        const bot = this.getBot();
        const l = bot.getLocalizer();

        const channelId = this.getConfig().get('channel-id');
        let channel;
        if (channelId && (channel = member.guild.channels.get(channelId)) && channel.type === 'text') {
            const commandPrefix = bot.getConfig().get('discord.commands.prefix');
            const moduleGw2 = bot.getModule('guildwars2');
            const commandEu = `${commandPrefix}${moduleGw2.getActivity('region-eu').getTriggers()[0]}`;
            const commandNa = `${commandPrefix}${moduleGw2.getActivity('region-na').getTriggers()[0]}`;
            return await channel.send(l.t('module.utilities:welcome-new-member.welcome', { member: member.toString(), region_na_command: commandNa, region_eu_command: commandEu }));
        }
    }
}

module.exports = HookWelcomeNewMember;
