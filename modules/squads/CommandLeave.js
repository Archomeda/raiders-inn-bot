'use strict';

const
    CommandSquadBase = require('./CommandSquadBase'),
    CommandError = require('../../errors/CommandError');

class CommandLeave extends CommandSquadBase {
    constructor(module, commandConfig) {
        super(module, commandConfig);

        this.id = 'leave';
        this.helpText = 'Leaves the current squad you are in. This only works in a squad channel.';
        this.shortHelpText = 'Leaves your current squad';
    }

    onCommand(response) {
        const squad = this.checkSquadChannel(response.message.channel);
        console.log(squad.leader, response.message.author.id);
        if (squad.leader === response.message.member.id) {
            throw new CommandError(
                "You can't leave the squad because you're the squad leader. " +
                'You have to either transfer your squad leader status with `!transfer` or disband the squad entirely with `!disband`.'
            );
        }
        const textChannel = response.message.guild.channels.get(squad.textChannel);
        return textChannel.sendMessage(`${response.message.member} has left the squad.`).then(() => squad.removeMember(response.message.member));
    }
}

module.exports = CommandLeave;
