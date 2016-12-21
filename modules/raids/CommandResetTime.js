'use strict';

const
    moment = require('moment-timezone'),

    Command = require('../Command'),
    ReplyToMentionedUsersMiddleware = require('../../middleware/ReplyToMentionedUsersMiddleware');

class CommandResetTime extends Command {
    constructor(module) {
        super(module);

        this.helpText = 'Shows the current raid reset time and how much time there is left until the reset happens. This will also show a link to the wiki containing all Guild Wars 2 reset times.';
        this.shortHelpText = 'Shows the raid reset time';

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
        return `Reset will happen **${moment().to(nextReset)}**.\n\n` +
            `Raid rewards reset every ${nextReset.format('dddd [at] H:mm')} UTC. Other timezones:\n` +
            timezones.map(time => `:small_blue_diamond: ${time}: ${nextReset.clone().tz(time.replace(' - ', '/').replace(' ', '_')).format('dddd [at] H:mm')}`).join('\n') + '\n\n' +
            'For a full overview, check the wiki: https://wiki.guildwars2.com/wiki/Server_reset';
    }
}

module.exports = CommandResetTime;