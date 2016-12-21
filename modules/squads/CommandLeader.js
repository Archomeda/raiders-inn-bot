'use strict';

const
    Promise = require('bluebird'),
    i18next = Promise.promisifyAll(require('i18next')),

    CommandSquadBase = require('./CommandSquadBase'),
    CommandError = require('../../errors/CommandError');

class CommandLeader extends CommandSquadBase {
    constructor(module) {
        super(module);
        i18next.loadNamespacesAsync('squads').then(() => {
            this.helpText = i18next.t('squads:leader.help');
            this.shortHelpText = i18next.t('squads:leader.short-help');
        });
    }

    onCommand(response) {
        const squad = this.checkSquadChannel(response.message.channel);
        if (!squad.leader) {
            return i18next.t('squads:leader.response-no-leader');
        }
        return i18next.t('squads:leader.response', { leader: response.message.guild.members.get(squad.leader).toString() });
    }
}

module.exports = CommandLeader;
