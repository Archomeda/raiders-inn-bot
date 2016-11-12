'use strict';

const
    config = require('config'),

    CommandSquadBase = require('./CommandSquadBase'),
    CommandError = require('../errors/CommandError');

class CommandTransfer extends CommandSquadBase {
    constructor(module) {
        super(module);

        this.id = 'transfer';
        this.name = config.get('modules.squads.command_transfer');
        this.helpText = 'Transfers squad leader status to the mentioned user. This only works in a squad channel.';
        this.shortHelpText = 'Transfers squad leader status to the mentioned user';
    }

    onCommand(message, params) {
        const squad = this.checkSquadChannel(message.channel);
        this.checkLeader(squad, message.member);
        const mentions = this.filterMentionsInside(squad, message.member, message.mentions.users.array());
        if (mentions.length === 0) {
            throw new CommandError(`This command will only work if you mention a person, like ${message.author}.`);
        }
        return message.guild.fetchMember(mentions[0]).then(member => {
            return squad.setLeader(member).then(() => `The squad leader is now ${member}.`);
        });
    }
}

module.exports = CommandTransfer;
