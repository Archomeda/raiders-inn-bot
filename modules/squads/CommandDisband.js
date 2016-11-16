'use strict';

const
    CommandSquadBase = require('./CommandSquadBase'),
    CommandError = require('../../errors/CommandError');

class CommandDisband extends CommandSquadBase {
    constructor(module) {
        super(module);

        this.helpText = 'Disbands the current squad you are the leader of. This only works in a squad channel.';
        this.shortHelpText = 'Disbands your squad';
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
