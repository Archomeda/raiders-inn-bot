'use strict';

const
    Promise = require('bluebird'),
    i18next = Promise.promisifyAll(require('i18next')),

    CommandSquadBase = require('./CommandSquadBase'),
    CommandError = require('../../errors/CommandError');

class CommandDisband extends CommandSquadBase {
    constructor(module) {
        super(module);
        i18next.loadNamespacesAsync('squads').then(() => {
            this.helpText = i18next.t('squads:disband.help');
            this.shortHelpText = i18next.t('squads:disband.short-help');
        });
    }

    onCommand(response) {
        const squad = this.checkSquadChannel(response.message.channel);
        this.checkLeader(squad, response.message.member);
        return squad.deleteChannels(response.message.guild).then(() => {
            this.module.squads.splice(this.module.squads.indexOf(squad), 1);
            return null;
        });
    }
}

module.exports = CommandDisband;
