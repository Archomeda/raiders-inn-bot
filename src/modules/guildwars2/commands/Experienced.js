'use strict';

const AutoRemoveMessage = require('../../../../bot/middleware/AutoRemoveMessage');

const DiscordCommand = require('../../../../bot/modules/DiscordCommand');

const models = require('../../../models');


class CommandExperienced extends DiscordCommand {
    constructor(bot) {
        super(bot, 'experienced', ['experienced']);
        this._localizerNamespaces = 'module.guildwars2';

        this.setMiddleware(new AutoRemoveMessage(bot, this, { defaultRequest: 0, defaultResponse: 60 })); // Auto remove response after 1 minute
    }

    async _toggleAllow(member) {
        const bot = this.getBot();
        const l = bot.getLocalizer();
        const config = this.getModule().getConfig().root(this.getId());
        const discordId = member.id;

        const roleId = config.get('experienced-role-id');
        let account = await models.Account.findOne({ discordId });
        if (!account) {
            account = new models.Account({ discordId });
        }

        // Was not allowed, change to allowed
        if (!account.allowExperienced) {
            account.allowExperienced = true;
            await account.save();
            if (account.isExperienced) {
                await member.addRole(roleId);
                return l.t('module.guildwars2:experienced.response-toggle-on-allow');
            }
            return l.t('module.guildwars2:experienced.response-allow');
        }

        // Was allowed, change to not allowed
        account.allowExperienced = false;
        await account.save();
        if (account.isExperienced) {
            await member.removeRole(roleId);
            return l.t('module.guildwars2:experienced.response-toggle-off-disallow');
        }
        return l.t('module.guildwars2:experienced.response-disallow');
    }

    async onCommand(message) {
        const bot = this.getBot();
        const l = bot.getLocalizer();

        if (message.channel.type !== 'text') {
            return l.t('module.guildwars2:experienced.response-no-dm');
        }

        const member = await message.guild.fetchMember(message.author);
        if (!member) {
            return l.t('module.guildwars2:experienced.response-fetch-failed');
        }
        return this._toggleAllow(member);
    }
}

module.exports = CommandExperienced;
