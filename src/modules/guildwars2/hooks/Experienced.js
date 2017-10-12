'use strict';

const DiscordHook = require('../../../../bot/modules/DiscordHook');

const models = require('../../../models');


const regex = {
    li: /(\d+) Legendary Insights Earned/,
    clear: /cleared everything.*(⭐|:star:)/
};


class HookExperienced extends DiscordHook {
    constructor(bot) {
        super(bot, 'experienced-hook');
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
        if (!member) {
            // No mentions
            return;
        }
        const discordId = member.id;
        let account = await models.Account.findOne({ discordId });
        if (!account) {
            account = new models.Account({ discordId });
        }
        if (account.isExperienced || !account.allowExperienced) {
            // Already experienced or doesn't allow to be experienced
            return;
        }

        let passed = false;
        let text = message.content;
        if (message.embeds.length > 0) {
            const embed = message.embeds[0];
            text = `${embed.title}\n${embed.description}\n`;
            for (const field of embed.fields) {
                text += `${field.name}\n${field.value}\n`;
            }
        }
        if (!text) {
            return;
        }

        let match;
        if (liReq !== false && (match = text.match(regex.li))) {
            // LI
            if (parseInt(match[1], 10) >= liReq) {
                passed = 'li';
            }
        } else if (clearReq && text.match(regex.clear)) {
            // Full clear
            passed = 'clear';
        }

        if (passed) {
            account.isExperienced = true;
            await account.save();
            if (!member.roles.has(expRoleId)) {
                return Promise.all([
                    member.addRole(expRoleId, l.t(`module.guildwars2:experienced.audit-passed-by-${passed}`)),
                    message.channel.send(l.t('module.guildwars2:experienced.response-passed-experienced-check', { user: member.toString() }))
                ]);
            }
        }
    }
}

module.exports = HookExperienced;
