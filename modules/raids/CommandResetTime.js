'use strict';

const
    moment = require('moment-timezone'),
    Promise = require('bluebird'),
    i18next = Promise.promisifyAll(require('i18next')),

    Command = require('../Command'),
    ReplyToMentionedUsersMiddleware = require('../../middleware/ReplyToMentionedUsersMiddleware');

class CommandResetTime extends Command {
    constructor(module) {
        super(module);
        i18next.loadNamespacesAsync('raids').then(() => {
            this.helpText = i18next.t('raids:reset-time.help');
            this.shortHelpText = i18next.t('raids:reset-time.short-help');
        });

        this.middleware = new ReplyToMentionedUsersMiddleware();
    }

    onCommand(response) {
        const nextReset = moment().utc().day(1).hour(7).minute(30).seconds(0);
        if (nextReset.isBefore(moment())) {
            nextReset.add(1, 'w');
        }
        const timezones = [
            'America - Los Angeles',
            'America - New York',
            'Europe - London',
            'Europe - Paris',
            'Australia - Sydney',
            'Asia - Tokyo'
        ];
        return i18next.t('raids:reset-time.response', {
            next_reset: moment().to(nextReset),
            reset: nextReset.format('dddd [at] H:mm'),
            timezones: timezones.map(time => `🔹 ${time}: ${nextReset.clone().tz(time.replace(' - ', '/').replace(' ', '_')).format('dddd [at] H:mm')}`).join('\n'),
            full_overview_url: 'https://wiki.guildwars2.com/wiki/Server_reset'
        });
    }
}

module.exports = CommandResetTime;
