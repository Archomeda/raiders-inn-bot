'use strict';

const
    Promise = require('bluebird'),
    i18next = Promise.promisifyAll(require('i18next')),

    CommandSquadBase = require('./CommandSquadBase'),
    CommandError = require('../../errors/CommandError'),
    MentionsOnlyMiddleware = require('../../middleware/MentionsOnlyMiddleware');

class CommandKick extends CommandSquadBase {
    constructor(module) {
        super(module);
        i18next.loadNamespacesAsync('squads').then(() => {
            this.helpText = i18next.t('squads:kick.help');
            this.shortHelpText = i18next.t('squads:kick.short-help');
        });

        this.middleware = new MentionsOnlyMiddleware();
    }

    onCommand(response) {
        const squad = this.checkSquadChannel(response.message.channel);
        this.checkLeader(squad, response.message.member);
        return Promise.mapSeries(response.mentions, user => response.message.guild.fetchMember(user))
            .then(members => {
                return squad.removeMembers(members).then(() => {
                    const textChannel = response.message.guild.channels.get(squad.textChannel);
                    textChannel.sendMessage(i18next.t('squads:kick.message-kicked', {
                        leader: response.message.member.toString(),
                        members: members.join(', ')
                    }));
                });
            });
    }
}

module.exports = CommandKick;
