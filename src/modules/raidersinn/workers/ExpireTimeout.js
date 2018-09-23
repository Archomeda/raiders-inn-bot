'use strict';

const Worker = require('../../../../bot/modules/Worker');

const models = require('../../../models');


class WorkerExpireTimeout extends Worker {
    constructor(bot) {
        super(bot, 'timeout-expire');
        this._localizerNamespaces = 'module.raidersinn';
    }

    async check() {
        const config = this.getModule().getConfig().root('timeout');
        const roleId = config.get('role-id');
        const guilds = this.getBot().getClient().guilds.array();

        try {
            const expired = (await models.Account.find({ hasTimeout: true })).filter(a => {
                const timeout = a.timeouts[a.timeouts.length - 1];
                return !timeout || timeout.end < new Date();
            });
            await Promise.all(expired.map(a => Promise.all(guilds
                .filter(g => g.members.has(a.discordId))
                .map(async g => (await g.fetchMember(a.discordId)).removeRole(roleId, 'Timeout expired')))));
            await Promise.all(expired.map(a => {
                a.hasTimeout = false;
                return a.save();
            }));
            if (expired.length > 0) {
                this.log(`Timeouts expired for ${expired.length} accounts: ${expired.map(a => a.discordId).join(', ')}`);
            }
        } catch (err) {
            this.log(`Error while checking for expired timeouts: ${err.message}`, 'error');
        }
    }

    async enableWorker() {
        this._intervalId = setInterval(this.check.bind(this), 60 * 60 * 1000);
        setTimeout(this.check.bind(this), 1000);
    }

    async disableWorker() {
        if (this._intervalId) {
            clearInterval(this._intervalId);
        }
    }
}

module.exports = WorkerExpireTimeout;
