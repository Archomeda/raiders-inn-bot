'use strict';

const
    CommandSquadBase = require('./CommandSquadBase'),
    CommandError = require('../../errors/CommandError'),
    MentionsOnlyMiddleware = require('../../middleware/MentionsOnlyMiddleware');

class CommandTransfer extends CommandSquadBase {
    constructor(module) {
        super(module);

        this.helpText = 'Transfers squad leader status to the mentioned user. This only works in a squad channel.';
        this.shortHelpText = 'Transfers squad leader status to the mentioned user';

        this.middleware = new MentionsOnlyMiddleware();
    }

    onCommand(response) {
        const squad = this.checkSquadChannel(response.message.channel);
        this.checkLeader(squad, response.message.member);
        return response.message.guild.fetchMember(response.mentions[0]).then(member => {
            return squad.setLeader(member).then(() => `The squad leader is now ${member}.`);
        });
    }
}

module.exports = CommandTransfer;
