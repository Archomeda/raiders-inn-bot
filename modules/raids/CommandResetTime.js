'use strict';

const
    config = require('config'),
    moment = require('moment-timezone'),

    Command = require('../Command');

class CommandResetTime extends Command {
    constructor(module) {
        super(module);

        this.id = 'reset_time';
        this.name = config.get('modules.raids.command_reset_time');
        this.helpText = 'Shows the current raid reset time and how much time there is left until the reset happens. This will also show a link to the wiki containing all Guild Wars 2 reset times.';
        this.shortHelpText = 'Shows the raid reset time';
        this.cooldownType = 'global';
    }

    onCommand(message, params) {
        const nextReset = moment().utc().day(8).hour(7).minute(30);
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
