'use strict';

const
    config = require('config'),
    BaseModule = require('./base_module');

class RegionAssignment extends BaseModule {
    constructor(bot, config) {
        super(bot, config);
        this.name = 'Region Assignment';
    }

    assignRegionRole(member, region) {
        const role = member.guild.roles.find('name', config.modules.region_assignment[region].role);
        return member.addRole(role)
            .then(() => `You should have been **assigned** to **${role.name}**. If not, please contact one of the staff members.`);
    }

    removeRegionRole(member, region) {
        const role = member.guild.roles.find('name', config.modules.region_assignment[region].role);
        return member.removeRole(role)
            .then(() => `You should have been **removed** from **${role.name}**. If not, please contact one of the staff members.`);
    }

    cmd_assignEU() {
        return {
            id: config.modules.region_assignment.eu.command_assign,
            channel_type: 'text',
            channels: config.modules.region_assignment.channels,
            on_command: message => {
                if (!config.modules.region_assignment.eu.enabled) {
                    return "I'm sorry, but this region is currently disabled.";
                }
                return this.assignRegionRole(message.member, 'eu');
            }
        };
    }

    cmd_assignNA() {
        return {
            id: config.modules.region_assignment.na.command_assign,
            channel_type: 'text',
            channels: config.modules.region_assignment.channels,
            on_command: message => {
                if (!config.modules.region_assignment.na.enabled) {
                    return "I'm sorry, but this region is currently disabled.";
                }
                return this.assignRegionRole(message.member, 'na');
            }
        };
    }

    cmd_assignCN() {
        return {
            id: config.modules.region_assignment.cn.command_assign,
            channel_type: 'text',
            channels: config.modules.region_assignment.channels,
            on_command: message => {
                if (!config.modules.region_assignment.cn.enabled) {
                    return "I'm sorry, but this region is currently disabled.";
                }
                return this.assignRegionRole(message.member, 'cn');
            }
        };
    }

    cmd_removeEU() {
        return {
            id: config.modules.region_assignment.eu.command_remove,
            channel_type: 'text',
            channels: config.modules.region_assignment.channels,
            on_command: message => {
                if (!config.modules.region_assignment.eu.enabled) {
                    return "I'm sorry, but this region is currently disabled.";
                }
                return this.removeRegionRole(message.member, 'eu');
            }
        };
    }

    cmd_removeNA() {
        return {
            id: config.modules.region_assignment.na.command_remove,
            channel_type: 'text',
            channels: config.modules.region_assignment.channels,
            on_command: message => {
                if (!config.modules.region_assignment.na.enabled) {
                    return "I'm sorry, but this region is currently disabled.";
                }
                return this.removeRegionRole(message.member, 'na');
            }
        };
    }

    cmd_removeCN() {
        return {
            id: config.modules.region_assignment.cn.command_remove,
            channel_type: 'text',
            channels: config.modules.region_assignment.channels,
            on_command: message => {
                if (!config.modules.region_assignment.cn.enabled) {
                    return "I'm sorry, but this region is currently disabled.";
                }
                return this.removeRegionRole(message.member, 'cn');
            }
        };
    }
}

module.exports = RegionAssignment;
