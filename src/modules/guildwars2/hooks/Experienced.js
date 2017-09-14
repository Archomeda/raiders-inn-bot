'use strict';

const DiscordHook = require('../../../../bot/modules/DiscordHook');


const regex = {
    li: /(\d+) Legendary Insights Earned/,
    clear: /cleared everything.*⭐/
};


class HookExperienced extends DiscordHook {
    constructor(bot) {
        super(bot, 'experienced');
        this._hooks = {
            message: this.onMessage.bind(this)
        };
        this._localizerNamespaces = 'module.guildwars2';
    }

    async onMessage(message) {
        const bot = this.getBot();
        const config = this.getConfig();
        const l = bot.getLocalizer();

        const gw2botId = config.get('gw2bot-id');
        const expRoleId = config.get('experienced-role-id');
        const liReq = config.get('li');
        const clearReq = config.get('full-clear');

        if (!expRoleId || liReq === false || !clearReq) {
            // Nothing configured
            return;
        }

        if (message.author.id !== gw2botId) {
            // Only listen to GW2Bot messages
            return;
        }

        if (!message.mentions.members) {
            // No mentions
            return;
        }
        const member = message.mentions.members.first();

        let passed = false;
        const text = message.embeds[0] || message.content;
        let match;
        if (liReq !== false && (match = text.match(regex.li))) {
            // LI
            if (parseInt(match[1], 10) >= liReq) {
                passed = true;
            }
        } else if (clearReq && text.match(regex.clear)) {
            passed = true;
        }

        if (passed) {
            return Promise.all([
                message.channel.send(l.t('module.guildwars2:experienced.response-passed-experienced-check', { user: member.toString() })),
                member.addRole(expRoleId, 'Automatically verified by LI and/or full raid clear requirement')
            ]);
        }
    }
}

module.exports = HookExperienced;
