'use strict';

const
    _ = require('lodash'),
    Promise = require('bluebird'),

    Command = require('../Command'),
    CommandError = require('../../errors/CommandError');

class CommandAssignmentBase extends Command {
    checkGuild(member) {
        if (!member.guild) {
            if (member.presence.status === 'offline') {
                throw new CommandError("You are not yet fully registered on the server. There is a limitation that requires you to change your status to online. Please try again afterwards.");
            } else {
                throw new CommandError("You are not yet fully registered on the server. Please contact one of the staff members to help you out.");
            }
        }
    }

    assignRegionRole(member, region) {
        this.checkGuild(member);

        const role = this.module.config.roles[region];
        const roleInst = member.guild.roles.get(role);
        if (member.roles.has(role)) {
            return `You are already assigned to ${roleInst.name}.`
        }

        const unassignedRole = this.module.config.roles.unassigned;
        // For some odd reason we have to delay a little bit after applying roles before continuing
        return Promise.resolve(member.addRole(role))
            .delay(500)
            .then(member => {
                if (member.roles.has(unassignedRole)) {
                    return member.removeRole(unassignedRole);
                }
                return member;
            })
            .delay(500)
            .then(member => {
                const roleInst = member.guild.roles.get(role);
                if (member.roles.has(role)) {
                    return `Done! You have been **assigned** to **${roleInst.name}**.`;
                } else {
                    return `Something might have gone wrong as it seems you have not been assigned to **${roleInst.name}**. ` +
                        `Please double check and contact a staff member if it didn't work.`;
                }
            });
    }

    removeRegionRole(member, region) {
        this.checkGuild(member);

        const role = this.module.config.roles[region];
        const roleInst = member.guild.roles.get(role);
        if (!member.roles.has(role)) {
            return `You are not part of ${roleInst.name}.`
        }

        const unassignedRole = this.module.config.roles.unassigned;
        // For some odd reason we have to delay a little bit after removing roles before continuing
        return Promise.resolve(member.removeRole(role))
            .delay(500)
            .then(member => {
                let roles = Object.assign({}, this.module.config.roles);
                roles[region] = null;
                roles.unassigned = null;
                roles = Object.values(roles).filter(r => r);
                if (_.intersection(member.roles.keyArray(), roles).length === 0) {
                    // No roles assigned, assign unassigned
                    return member.addRole(unassignedRole);
                }
                return member;
            })
            .delay(500)
            .then(member => {
                if (!member.roles.has(role)) {
                    if (member.roles.has(unassignedRole)) {
                        return `Done! You have been **removed** from **${roleInst.name}**. ` +
                            '**Please note that you are not assigned to any server right now.** ' +
                            `This means people are less likely to find you, and you don't have access to the restricted server channels. ` +
                            `It's entirely up to you, but it's important that you choose your server.`;
                    } else {
                        return `Done! You have been **removed** from **${roleInst.name}**.`;
                    }
                } else {
                    return `Something might have gone wrong as it seems you have not been removed from **${roleInst.name}**. ` +
                        `Please double check and contact a staff member if it didn't work.`;
                }
            });
    }
}

module.exports = CommandAssignmentBase;
