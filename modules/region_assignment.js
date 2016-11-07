'use strict';

const
    config = require('config'),
    BaseModule = require('./base_module');

class RegionAssignment extends BaseModule {
    constructor(bot, config) {
        super(bot, config);
        this.name = 'Region Assignment';
    }

    checkEnabled(region) {
        return config.get(`modules.region_assignment.${region}.enabled`);
    }

    assignRegionRole(member, region) {
        if (!this.checkEnabled(region)) {
            return `Region ${region.toUpperCase()} is currently not available.`;
        }

        const role = member.guild.roles.find('name', config.get(`modules.region_assignment.${region}.role`));
        return member.addRole(role)
            .then(() => `You should have been **assigned** to **${role.name}**. If not, please contact one of the staff members.`);
    }

    removeRegionRole(member, region) {
        if (!this.checkEnabled(region)) {
            return `Region ${region.toUpperCase()} is currently not available.`;
        }

        const role = member.guild.roles.find('name', config.get(`modules.region_assignment.${region}.role`));
        return member.removeRole(role)
            .then(() => `You should have been **removed** from **${role.name}**. If not, please contact one of the staff members.`);
    }

    cmd_assignEU() {
        return {
            id: config.get('modules.region_assignment.eu.command_assign'),
            channel_type: 'text',
            channels: config.get('modules.region_assignment.channels'),
            on_command: message => {
                return this.assignRegionRole(message.member, 'eu');
            }
        };
    }

    cmd_assignNA() {
        return {
            id: config.get('modules.region_assignment.na.command_assign'),
            channel_type: 'text',
            channels: config.get('modules.region_assignment.channels'),
            on_command: message => {
                return this.assignRegionRole(message.member, 'na');
            }
        };
    }

    cmd_assignCN() {
        return {
            id: config.get('modules.region_assignment.cn.command_assign'),
            channel_type: 'text',
            channels: config.get('modules.region_assignment.channels'),
            on_command: message => {
                return this.assignRegionRole(message.member, 'cn');
            }
        };
    }

    cmd_removeEU() {
        return {
            id: config.get('modules.region_assignment.eu.command_remove'),
            channel_type: 'text',
            channels: config.get('modules.region_assignment.channels'),
            on_command: message => {
                return this.removeRegionRole(message.member, 'eu');
            }
        };
    }

    cmd_removeNA() {
        return {
            id: config.get('modules.region_assignment.na.command_remove'),
            channel_type: 'text',
            channels: config.get('modules.region_assignment.channels'),
            on_command: message => {
                return this.removeRegionRole(message.member, 'na');
            }
        };
    }

    cmd_removeCN() {
        return {
            id: config.get('modules.region_assignment.cn.command_remove'),
            channel_type: 'text',
            channels: config.get('modules.region_assignment.channels'),
            on_command: message => {
                return this.removeRegionRole(message.member, 'cn');
            }
        };
    }
}

module.exports = RegionAssignment;
