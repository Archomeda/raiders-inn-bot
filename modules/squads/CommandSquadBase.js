'use strict';

const
    _ = require('lodash'),
    i18next = require('i18next'),

    Command = require('../Command'),
    CommandError = require('../../errors/CommandError'),
    RestrictChannelsMiddleware = require('../../middleware/RestrictChannelsMiddleware');

class CommandSquadBase extends Command {
    constructor(module) {
        super(module);
        i18next.loadNamespaces('squads');

        this.middleware = new RestrictChannelsMiddleware({
            types: 'text',
            channels: this.middlewareChannels.bind(this)
        });
    }

    middlewareChannels(message, command, params) {
        if (!message.member) {
            return null;
        }

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
            throw new CommandError(i18next.t('squads:squad-base.response-no-squad-channel'));
        }
        return squad;
    }

    checkLeader(squad, member) {
        if (squad.leader !== member.id) {
            throw new CommandError(i18next.t('squads:squad-base.response-no-leader'));
        }
        return member;
    }
}

module.exports = CommandSquadBase;
