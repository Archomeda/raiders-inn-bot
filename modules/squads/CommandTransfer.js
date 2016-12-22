'use strict';

const
    Promise = require('bluebird'),
    i18next = Promise.promisifyAll(require('i18next')),

    CommandSquadBase = require('./CommandSquadBase'),
    CommandError = require('../../errors/CommandError'),
    MentionsOnlyMiddleware = require('../../middleware/MentionsOnlyMiddleware');

class CommandTransfer extends CommandSquadBase {
    constructor(module) {
        super(module);
        i18next.loadNamespacesAsync('squads').then(() => {
            this.helpText = i18next.t('squads:transfer.help');
            this.shortHelpText = i18next.t('squads:transfer.short-help');
        });

        this.middleware = new MentionsOnlyMiddleware();
    }

    onCommand(response) {
        const squad = this.checkSquadChannel(response.message.channel);
        this.checkLeader(squad, response.message.member);
        return response.message.guild.fetchMember(response.mentions[0]).then(member => {
            return squad.setLeader(member).then(() => i18next.t('squads:transfer.message-transfer', { leader: member.toString() }));
        });
    }
}

module.exports = CommandTransfer;
