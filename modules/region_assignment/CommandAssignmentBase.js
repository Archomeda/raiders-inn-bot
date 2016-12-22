'use strict';

const
    Promise = require('bluebird'),
    i18next = Promise.promisifyAll(require('i18next')),
    _ = require('lodash'),

    Command = require('../Command'),
    CommandError = require('../../errors/CommandError');

class CommandAssignmentBase extends Command {
    constructor(module) {
        super(module);
        i18next.loadNamespaces('region-assignment');
    }

    checkGuild(member) {
        if (!member.guild) {
            if (member.presence.status === 'offline') {
                throw new CommandError(i18next.t('region-assignment:assignment-base.response-not-fully-registered-offline'));
            } else {
                throw new CommandError(i18next.t('region-assignment:assignment-base.response-not-fully-registered'));
            }
        }
    }

    assignRegionRole(member, region) {
        this.checkGuild(member);

        const role = this.module.config.roles[region];
        const roleInst = member.guild.roles.get(role);
        if (member.roles.has(role)) {
            return i18next.t('region-assignment:assignment-base.response-already-assigned', { role: roleInst.name });
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
                    return i18next.t('region-assignment:assignment-base.response-assigned', { role: roleInst.name });
                } else {
                    return i18next.t('region-assignment:assignment-base.response-assigned-error', { role: roleInst.name });
                }
            });
    }

    removeRegionRole(member, region) {
        this.checkGuild(member);

        const role = this.module.config.roles[region];
        const roleInst = member.guild.roles.get(role);
        if (!member.roles.has(role)) {
            return i18next.t('region-assignment:assignment-base.response-already-removed', { role: roleInst.name });
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
                        return i18next.t('region-assignment:assignment-base.response-removed-no-server', { role: roleInst.name });
                    } else {
                        return i18next.t('region-assignment:assignment-base.response-removed', { role: roleInst.name });
                    }
                } else {
                    return i18next.t('region-assignment:assignment-base.response-removed-error', { role: roleInst.name });
                }
            });
    }
}

module.exports = CommandAssignmentBase;
