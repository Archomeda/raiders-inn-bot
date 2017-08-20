'use strict';

const AutoRemoveMessage = require('../../../../bot/middleware/AutoRemoveMessage');

const DiscordCommand = require('../../../../bot/modules/DiscordCommand');


class CommandRegionNa extends DiscordCommand {
    constructor(bot) {
        super(bot, 'region-na', ['region na', 'na']);
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

    async onCommand(message, parameters) {
        const bot = this.getBot();
        const client = bot.getClient();
        const l = bot.getLocalizer();

        let user = message.member || message.user;
        if (user.roles) {
            const result = await this._toggleRole(user);
            if (result) {
                return l.t('module.guildwars2:region-na.response-assigned');
            }
            return l.t('module.guildwars2:region-na.response-removed');
        }

        const exec = client.guilds
            .map(server => server.member(user))
            .filter(u => u)
            .map(user => this._toggleRole(user));
        await Promise.all(exec);
        return l.t('module.guildwars2:region-na.response-changed-applied');
    }
}

module.exports = CommandRegionNa;
