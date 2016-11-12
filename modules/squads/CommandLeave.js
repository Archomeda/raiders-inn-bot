'use strict';

const
    config = require('config'),

    CommandSquadBase = require('./CommandSquadBase'),
    CommandError = require('../errors/CommandError');

class CommandLeave extends CommandSquadBase {
    constructor(module) {
        super(module);

        this.id = 'leave';
        this.name = config.get('modules.squads.command_leave');
        this.helpText = 'Leaves the current squad you are in. This only works in a squad channel.';
        this.shortHelpText = 'Leaves your current squad';
    }

    onCommand(message, params) {
        const squad = this.checkSquadChannel(message.channel);
        if (squad.leader === message.member.id) {
            throw new CommandError(
                "You can't leave the squad because you're the squad leader. " +
                'You have to either transfer your squad leader status with `!transfer` or disband the squad entirely with `!disband`.'
            );
        }
        const textChannel = message.guild.channels.get(squad.textChannel);
        return textChannel.sendMessage(`${message.member} has left the squad.`).then(() => squad.removeMember(message.member));
    }
}

module.exports = CommandLeave;
