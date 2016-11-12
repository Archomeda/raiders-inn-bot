'use strict';

const
    config = require('config'),

    CommandSquadBase = require('./command-squad-base'),
    CommandError = require('../errors/CommandError');

class CommandDisband extends CommandSquadBase {
    constructor(module) {
        super(module);

        this.id = 'disband';
        this.name = config.get('modules.squads.command_disband');
        this.helpText = 'Disbands the current squad you are the leader of. This only works in a squad channel.';
        this.shortHelpText = 'Disbands your squad';
    }

    onCommand(message, params) {
        const squad = this.checkSquadChannel(message.channel);
        this.checkLeader(squad, message.member);
        return squad.deleteChannels(message.guild).then(() => {
            this.module.squads.splice(this.module.squads.indexOf(squad), 1);
            return null;
        });
    }
}

module.exports = CommandDisband;
