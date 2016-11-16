'use strict';

const
    CommandSquadBase = require('./CommandSquadBase'),
    CommandError = require('../../errors/CommandError');

class CommandLeader extends CommandSquadBase {
    constructor(module) {
        super(module);

        this.helpText = 'Gets the current leader of the squad. This only works in a squad channel.';
        this.shortHelpText = 'Gets the current leader of the squad';
    }

    onCommand(response) {
        const squad = this.checkSquadChannel(response.message.channel);
        if (!squad.leader) {
            return 'This squad has currently no leader.';
        }
        return `This squad is led by ${response.message.guild.members.get(squad.leader)}.`;
    }
}

module.exports = CommandLeader;
