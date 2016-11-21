'use strict';

const
    Promise = require('bluebird'),

    CommandSquadBase = require('./CommandSquadBase'),
    CommandError = require('../../errors/CommandError'),
    MentionsOnlyMiddleware = require('../../middleware/MentionsOnlyMiddleware');

class CommandKick extends CommandSquadBase {
    constructor(module) {
        super(module);

        this.helpText = 'Kicks one or more mentioned users from the squad. This only works in a squad channel.';
        this.shortHelpText = 'Kicks one or more mentioned users from the squad';

        this.middleware = new MentionsOnlyMiddleware();
    }

    onCommand(response) {
        const squad = this.checkSquadChannel(response.message.channel);
        this.checkLeader(squad, response.message.member);
        return Promise.mapSeries(response.mentions, user => response.message.guild.fetchMember(user))
            .then(members => {
                return squad.removeMembers(members).then(() => {
                    const textChannel = response.message.guild.channels.get(squad.textChannel);
                    textChannel.sendMessage(`${response.message.member} has kicked ${members.join(', ')}.`);
                });
            });
    }
}

module.exports = CommandKick;
