'use strict';

const
    config = require('config'),

    CommandSquadBase = require('./CommandSquadBase'),
    CommandError = require('../../errors/CommandError');

class CommandLeader extends CommandSquadBase {
    constructor(module) {
        super(module);

        this.id = 'leader';
        this.name = config.get('modules.squads.command_leader');
        this.helpText = 'Gets the current leader of the squad. This only works in a squad channel.';
        this.shortHelpText = 'Gets the current leader of the squad';
    }

    onCommand(message, params) {
        const squad = this.checkSquadChannel(message.channel);
        if (!squad.leader) {
            return 'This squad has currently no leader.';
        }
        return `This squad is led by ${message.guild.members.get(squad.leader)}.`;
    }
}

module.exports = CommandLeader;
