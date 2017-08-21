'use strict';

const DiscordHook = require('../../../../bot/modules/DiscordHook');

const ModuleGuildWars2 = require('../../guildwars2');


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
        try {
            if (channelId && (channel = member.guild.channels.get(channelId)) && channel.type === 'text') {
                const moduleGw2 = bot.getModule(ModuleGuildWars2);
                const commandEu = moduleGw2.getActivity('region-eu').getCommandRoute().getInvocation();
                const commandNa = moduleGw2.getActivity('region-na').getCommandRoute().getInvocation();
                return await channel.send(l.t('module.utilities:welcome-new-member.welcome', {
                    member: member.toString(),
                    region_na_command: commandNa,
                    region_eu_command: commandEu
                }));
            }
        } catch (err) {
            this.log(`Error while welcoming new member ${member.tag}:\n${err}`, 'warn');
        }
    }
}

module.exports = HookWelcomeNewMember;
