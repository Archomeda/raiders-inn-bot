'use strict';

const
    CommandSquadBase = require('./CommandSquadBase'),
    CommandError = require('../../errors/CommandError'),
    MentionsMiddleware = require('../../middleware/MentionsMiddleware');

class CommandTransfer extends CommandSquadBase {
    constructor(module) {
        super(module);

        this.helpText = 'Transfers squad leader status to the mentioned user. This only works in a squad channel.';
        this.shortHelpText = 'Transfers squad leader status to the mentioned user';

        this.middleware = new MentionsMiddleware({ types: 'mention' });
    }

    onCommand(response) {
        const squad = this.checkSquadChannel(response.message.channel);
        this.checkLeader(squad, response.message.member);
        const mentions = this.filterMentionsInside(squad, response.message.member, response.message.mentions.users.array());
        if (mentions.length === 0) {
            throw new CommandError(`This command will only work if you mention a person, like ${response.message.author}.`);
        }
        return response.message.guild.fetchMember(mentions[0]).then(member => {
            return squad.setLeader(member).then(() => `The squad leader is now ${member}.`);
        });
    }
}

module.exports = CommandTransfer;
