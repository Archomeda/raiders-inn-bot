'use strict';

const DiscordCommand = require('../../../../bot/modules/DiscordCommand');

const models = require('../../../models');


class CommandTimeout extends DiscordCommand {
    constructor(bot) {
        super(bot, 'timeout', ['timeout :user?:mentions :duration? :reason?']);
        this._localizerNamespaces = 'module.raidersinn';
    }

    async onCommand(message, parameters) {
        const bot = this.getBot();
        const client = bot.getClient();
        const l = bot.getLocalizer();
        const config = this.getConfig();

        if (!parameters.user) {
            // Show own info
            const discordId = message.author.id;

            const account = await models.Account.findOne({ discordId });
            if (!account || !account.hasTimeout || account.timeouts.length === 0) {
                return l.t('module.raidersinn:timeout.response-self-no-timeout');
            }

            const lastTimeout = account.timeouts[account.timeouts.length - 1];
            return l.t('module.raidersinn:timeout.response-self-timeout', { date: lastTimeout.end });
        } else if (!parameters.reason) {
            // Show other user's info
            if (!this.isCommandAllowed(message.member || message.author, 'other')) {
                return l.t('module.raidersinn:timeout.response-other-not-allowed');
            }

            const user = parameters.user.users[0];
            const account = await models.Account.findOne({ discordId: user.id });
            if (!account || !account.timeouts || account.timeouts.length === 0) {
                return l.t('module.raidersinn:timeout.response-other-no-timeouts');
            }

            let timeouts = account.timeouts.reverse().slice(0, 10);
            timeouts = await Promise.all(account.timeouts.map(async t => l.t('module.raidersinn:timeout.timeout', {
                start: t.start,
                end: t.end,
                reason: t.reason,
                by: (await client.fetchUser(t.by)).tag
            })));

            return l.t('module.raidersinn:timeout.response-other-timeouts', { timeouts: timeouts.join('\n') });
        } else if (parameters.reason) {
            // Perform timeout
            if (!this.isCommandAllowed(message.member || message.author, 'timeout')) {
                return l.t('module.raidersinn:timeout.response-perform-not-allowed');
            }

            const user = parameters.user.users[0];
            const roleId = config.get('role-id');
            let account = await models.Account.findOne({ discordId: user.id });
            if (!account) {
                account = new models.Account({ discordId: user.id });
            }
            if (!account.timeouts) {
                account.timeouts = [];
            }

            // Apply timeout
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + (parameters.duration || 0));
            account.timeouts.push({
                start: new Date(),
                end: endDate,
                reason: parameters.reason,
                by: message.author.id
            });
            account.hasTimeout = Boolean(parameters.duration);
            await account.save();

            const guilds = client.guilds.array();
            if (!account.hasTimeout) {
                // Perform 0-duration timeout
                await Promise.all(guilds
                    .filter(g => g.members.has(user.id))
                    .map(async g => (await g.fetchMember(user.id)).removeRole(roleId, `Timeout removed by ${user.tag}: ${parameters.reason}`)));
                if (config.get('send-dm')) {
                    await user.send(l.t('module.raidersinn:timeout.response-removed-dm'));
                }
                return l.t('module.raidersinn:timeout.response-removed-timeout', { user });
            }

            // Perform timeout
            await Promise.all(guilds
                .filter(g => g.members.has(user.id))
                .map(async g => (await g.fetchMember(user.id)).addRole(roleId, `Timed out by ${user.tag}: ${parameters.reason} (expires ${endDate})`)));
            if (config.get('send-dm')) {
                await user.send(l.t('module.raidersinn:timeout.response-perform-dm', {
                    reason: parameters.reason,
                    date: endDate
                }));
            }
            return l.t('module.raidersinn:timeout.response-perform-timeout', { user, date: endDate });
        }
    }
}

module.exports = CommandTimeout;
