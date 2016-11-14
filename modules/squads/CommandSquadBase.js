'use strict';

const
    _ = require('lodash'),

    Command = require('../Command'),
    CommandError = require('../../errors/CommandError'),
    RestrictChannelsMiddleware = require('../../middleware/RestrictChannelsMiddleware');

class CommandSquadBase extends Command {
    constructor(module, commandConfig) {
        super(module, commandConfig);

        this.middleware = new RestrictChannelsMiddleware({
            types: 'text',
            channels: this.middlewareChannels.bind(this)
        });
    }

    middlewareChannels(message, command, params) {
        // Check direct squad members
        const squad = command.getSquadByMember(message.member);
        if (squad) {
            return [squad.textChannel];
        }

        // Check for permanent access
        if (this.module.config.roles_with_permanent_access) {
            if (_.intersection(this.module.config.roles_with_permanent_access, message.member.roles.keyArray()).length > 0) {
                return this.module.squads.map(s => s.textChannel);
            }
        }
        return null;
    }

    getSquadByMember(member) {
        return this.module.squads.find(s => s.members.includes(member.id));
    }

    getSquadByChannel(channel) {
        return this.module.getSquadByChannel(channel);
    }

    checkSquadChannel(channel) {
        const squad = this.getSquadByChannel(channel);
        if (!squad) {
            throw new CommandError('You can only execute this command in a squad channel.');
        }
        return squad;
    }

    checkLeader(squad, member) {
        if (squad.leader !== member.id) {
            throw new CommandError('Only squad leaders can execute this command.');
        }
        return member;
    }
}

module.exports = CommandSquadBase;
