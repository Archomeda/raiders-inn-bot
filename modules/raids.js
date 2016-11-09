'use strict';

const
    config = require('config'),
    moment = require('moment-timezone'),

    BaseModule = require('./base_module');

class RaidsModule extends BaseModule {
    constructor(bot, config, filename) {
        super(bot, config, filename);
        this.name = 'Raids';
    }

    cmd_resetTime() {
        return {
            id: 'reset',
            command: config.get('modules.raids.command_reset'),
            cooldown: 'global',
            help: 'Shows the current raid reset time and how much time there is left until the reset happens. This will also show a link to the wiki containing all Guild Wars 2 reset times.',
            short_help: 'Shows the raid reset time',
            on_command: () => {
                const nextReset = moment().utc().day(8).hour(7).minute(30);
                const timezones = [
                    'America - Los Angeles',
                    'America - New York',
                    'Europe - London',
                    'Europe - Paris',
                    'Australia - Sydney',
                    'Asia - Tokyo'
                ];
                return `Reset will happen ${moment().to(nextReset)}.\n\n` +
                    `Raid rewards reset every ${nextReset.format('dddd [at] H:mm')} UTC. Other timezones:\n` +
                    timezones.map(time => `:small_blue_diamond: ${time}: ${nextReset.clone().tz(time.replace(' - ', '/').replace(' ', '_')).format('dddd [at] H:mm')}`).join('\n') + '\n\n' +
                    'For a full overview, check the wiki: https://wiki.guildwars2.com/wiki/Server_reset';
            }
        }
    }
}

module.exports = RaidsModule;
