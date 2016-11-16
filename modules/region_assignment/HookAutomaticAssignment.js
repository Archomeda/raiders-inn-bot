'use strict';

const
    _ = require('lodash'),

    DiscordHook = require('../DiscordHook');

class HookAutomaticAssignment extends DiscordHook {
    constructor(module) {
        super(module);

        this._hooks = {
            guildMemberAdd: this.onGuildMemberAdd,
            presenceUpdate: this.onPresenceUpdate
        };
    }

    fixRole(member) {
        try {
            if (member.user.bot) {
                return;
            }

            if (member.roles) {
                let roles = Object.assign({}, this.module.config.roles);
                const unassignedRole = roles.unassigned;
                roles.unassigned = null;
                roles = Object.values(roles).filter(r => r);
                if (_.intersection(member.roles.keyArray(), roles).length === 0) {
                    // No region roles assigned, assign unassigned
                    member.addRole(unassignedRole);
                } else {
                    // There are region roles assigned, check if the unassigned role is applied improperly
                    if (member.roles.has(unassignedRole)) {
                        member.removeRole(unassignedRole);
                    }
                }
            }
        } catch (err) {
            console.warn(`Caught error: ${err.message}`);
            console.warn(err.stack);
        }
    }

    onGuildMemberAdd(member) {
        this.fixRole(member);
    }

    onPresenceUpdate(oldMember, newMember) {
        this.fixRole(newMember);
    }
}

module.exports = HookAutomaticAssignment;
