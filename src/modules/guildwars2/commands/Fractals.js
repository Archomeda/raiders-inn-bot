'use strict';

const AutoRemoveMessage = require('../../../../bot/middleware/AutoRemoveMessage');

const DiscordCommand = require('../../../../bot/modules/DiscordCommand');


class CommandFractals extends DiscordCommand {
    constructor(bot) {
        super(bot, 'fractals', ['fractals']);
        this._localizerNamespaces = 'module.guildwars2';

        this.setMiddleware(new AutoRemoveMessage(bot, this, { defaultRequest: 0, defaultResponse: 60 })); // Auto remove response after 1 minute
    }

    async _toggleRole(member) {
        const roleId = this.getConfig().get('role-id');
        if (!member.roles.has(roleId)) {
            await member.addRole(roleId);
            return true;
        }

        await member.removeRole(roleId);
        return false;
    }

    async onCommand(message) {
        const bot = this.getBot();
        const l = bot.getLocalizer();

        if (message.channel.type !== 'text') {
            return l.t('module.guildwars2:fractals.response-no-dm');
        }

        const member = await message.guild.fetchMember(message.author);
        if (!member) {
            return l.t('module.guildwars2:fractals.response-fetch-failed');
        }
        const result = await this._toggleRole(member);
        return result ? l.t('module.guildwars2:fractals.response-assigned') : l.t('module.guildwars2:fractals.response-removed');
    }
}

module.exports = CommandFractals;
