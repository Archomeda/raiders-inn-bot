'use strict';

const AutoRemoveMessage = require('../../../../bot/middleware/AutoRemoveMessage');

const DiscordCommand = require('../../../../bot/modules/DiscordCommand');


class CommandRaider extends DiscordCommand {
    constructor(bot) {
        super(bot, 'raider', ['gw2']);
        this._localizerNamespaces = 'module.guildwars2';

        this.setMiddleware(new AutoRemoveMessage(bot, this, { defaultRequest: 0, defaultResponse: 60 })); // Auto remove response after 1 minute
    }

    async _toggleRole(user) {
        const roleId = this.getConfig().get('role-id');
        if (!user.roles.has(roleId)) {
            await user.addRole(roleId);
            return true;
        }

        await user.removeRole(roleId);
        return false;
    }

    async onCommand(message) {
        const bot = this.getBot();
        const l = bot.getLocalizer();

        if (message.channel.type !== 'text') {
            return l.t('module.guildwars2:raider.response-no-dm');
        }

        const member = message.guild.members.fetch(message.author);
        if (!member) {
            return l.t('module.guildwars2:raider.response-fetch-failed');
        }
        const result = await this._toggleRole(member);
        return result ? l.t('module.guildwars2:raider.response-assigned') : l.t('module.guildwars2:raider.response-removed');
    }
}

module.exports = CommandRaider;
