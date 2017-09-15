'use strict';

const moment = require('moment-timezone');

const Worker = require('../../../../bot/modules/Worker');


const pofReleaseDate = moment.utc([2017, 8, 22, 16]); // 22 September, 16:00 UTC

class WorkerPofCountdown extends Worker {
    constructor(bot) {
        super(bot, 'pof-countdown');
        this._localizerNamespaces = 'module.guildwars2';
    }

    async checkNickname() {
        const bot = this.getBot();
        const client = bot.getClient();
        const l = bot.getLocalizer();

        const dayDiff = pofReleaseDate.diff(moment(), 'days', true);
        let presence = '';

        if (dayDiff >= -7) {
            if (dayDiff < 0) {
                presence = l.t('module.guildwars2:pof-countdown.presence-pof'); // eslint-disable-line camelcase
            } else if (dayDiff < 1) {
                const hourDiff = Math.floor(dayDiff * 24);
                presence = l.t('module.guildwars2:pof-countdown.presence-countdown-hours', {
                    hours_left: hourDiff === 0 ? '<1' : hourDiff // eslint-disable-line camelcase
                });
            } else {
                const hourDiff = (dayDiff - Math.floor(dayDiff)) * 24;
                presence = l.t('module.guildwars2:pof-countdown.presence-countdown-days', {
                    days_left: Math.floor(dayDiff), // eslint-disable-line camelcase
                    hours_left: Math.floor(hourDiff) // eslint-disable-line camelcase
                });
            }
        }

        this.log(`Setting own game to '${presence}'`);
        await client.user.setGame(presence);
    }

    async enableWorker() {
        this._intervalId = setInterval(this.checkNickname.bind(this), 60 * 60 * 1000); // Every hour
        setTimeout(this.checkNickname.bind(this), 1000);
    }

    async disableWorker() {
        if (this._intervalId) {
            clearInterval(this._intervalId);
        }
    }
}

module.exports = WorkerPofCountdown;
