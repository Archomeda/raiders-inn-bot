'use strict';

const
    config = require('config'),

    CommandBase = require('../Command'),
    CommandError = require('../../errors/CommandError');

class CommandAssignmentBase extends CommandBase {
    constructor(module) {
        super(module);

        this.cooldownType = 'user';
        this.listenChannelTypes = 'text';
        this.listenChannels = config.get('modules.region_assignment.channels');
    }

    isRegionEnabled(region) {
        return config.get(`modules.region_assignment.${region}.enabled`);
    }

    checkRegionEnabled(region) {
        if (!this.isRegionEnabled(region)) {
            throw new CommandError(`Region ${region.toUpperCase()} is currently not available.`);
        }
    }

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
        this.checkRegionEnabled(region);
        this.checkGuild(member);

        const role = member.guild.roles.get(config.get(`modules.region_assignment.${region}.role`));
        return member.addRole(role)
            .then(() => `You should have been **assigned** to **${role.name}**. If not, please contact one of the staff members.`);
    }

    removeRegionRole(member, region) {
        this.checkRegionEnabled(region);
        this.checkGuild(member);

        const role = member.guild.roles.get(config.get(`modules.region_assignment.${region}.role`));
        return member.removeRole(role)
            .then(() => `You should have been **removed** from **${role.name}**. If not, please contact one of the staff members.`);
    }
}

module.exports = CommandAssignmentBase;
