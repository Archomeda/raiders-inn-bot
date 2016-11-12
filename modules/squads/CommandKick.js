'use strict';

const
    config = require('config'),

    CommandSquadBase = require('./CommandSquadBase'),
    CommandError = require('../errors/CommandError');

class CommandKick extends CommandSquadBase {
    constructor(module) {
        super(module);

        this.id = 'kick';
        this.name = config.get('modules.squads.command_kick');
        this.helpText = 'Kicks one or more mentioned users from the squad. This only works in a squad channel.';
        this.shortHelpText = 'Kicks one or more mentioned users from the squad';
    }

    onCommand(message, params) {
        const squad = this.checkSquadChannel(message.channel);
        this.checkLeader(squad, message.member);
        const mentions = this.filterMentionsInside(squad, message.member, message.mentions.users.array());
        if (mentions.length === 0) {
            throw new CommandError(`This command will only work if you mention one or more people, like ${message.author}.`);
        }
        return Promise.mapSeries(mentions, user => message.guild.fetchMember(user))
            .then(members => {
                return squad.removeMembers(members).then(() => {
                    const textChannel = message.guild.channels.get(squad.textChannel);
                    textChannel.sendMessage(`${message.member} has kicked ${members.join(', ')}.`);
                });
            });
    }
}

module.exports = CommandKick;
