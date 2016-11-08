'use strict';

const
    config = require('config'),
    BaseModule = require('./base_module');

class RegionAssignment extends BaseModule {
    constructor(bot, config, filename) {
        super(bot, config, filename);
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
            id: 'assign_eu',
            command: config.get('modules.region_assignment.eu.command_assign'),
            help: 'This allows you to assign yourself to the EU region.',
            short_help: 'Assign yourself to the EU region',
            channel_type: 'text',
            channels: config.get('modules.region_assignment.channels'),
            on_command: message => {
                return this.assignRegionRole(message.member, 'eu');
            }
        };
    }

    cmd_assignNA() {
        return {
            id: 'assign_na',
            command: config.get('modules.region_assignment.na.command_assign'),
            help: 'This allows you to assign yourself to the NA region.',
            short_help: 'Assign yourself to the NA region',
            channel_type: 'text',
            channels: config.get('modules.region_assignment.channels'),
            on_command: message => {
                return this.assignRegionRole(message.member, 'na');
            }
        };
    }

    cmd_assignCN() {
        return {
            id: 'assign_cn',
            command: config.get('modules.region_assignment.cn.command_assign'),
            help: 'This allows you to assign yourself to the CN region.',
            short_help: 'Assign yourself to the CN region',
            channel_type: 'text',
            channels: config.get('modules.region_assignment.channels'),
            on_command: message => {
                return this.assignRegionRole(message.member, 'cn');
            }
        };
    }

    cmd_removeEU() {
        return {
            id: 'remove_eu',
            command: config.get('modules.region_assignment.eu.command_remove'),
            help: 'This allows you to remove yourself from the EU region.',
            short_help: 'Remove yourself from the EU region',
            channel_type: 'text',
            channels: config.get('modules.region_assignment.channels'),
            on_command: message => {
                return this.removeRegionRole(message.member, 'eu');
            }
        };
    }

    cmd_removeNA() {
        return {
            id: 'remove_na',
            command: config.get('modules.region_assignment.na.command_remove'),
            help: 'This allows you to remove yourself from the NA region.',
            short_help: 'Remove yourself from the NA region',
            channel_type: 'text',
            channels: config.get('modules.region_assignment.channels'),
            on_command: message => {
                return this.removeRegionRole(message.member, 'na');
            }
        };
    }

    cmd_removeCN() {
        return {
            id: 'remove_cn',
            command: config.get('modules.region_assignment.cn.command_remove'),
            help: 'This allows you to remove yourself from the CN region.',
            short_help: 'Remove yourself from the CN region',
            channel_type: 'text',
            channels: config.get('modules.region_assignment.channels'),
            on_command: message => {
                return this.removeRegionRole(message.member, 'cn');
            }
        };
    }

    cmd_listNumbers() {
        return {
            id: 'numbers',
            command: config.get('modules.region_assignment.command_numbers'),
            help: 'Gets the amount of users assigned to each region.',
            short_help: 'Gets the amount of users assigned to each region',
            channel_type: 'text',
            on_command: message => {
                const regionLines = ['eu', 'na', 'cn']
                    .filter(region => config.get(`modules.region_assignment.${region}.enabled`))
                    .map(region => message.guild.roles.find('name', config.get(`modules.region_assignment.${region}.role`)))
                    .map(role => role ? `:small_blue_diamond: ${role.name}: ${role.members.size} ${role.members.size === 1 ? 'person' : 'people'}` : null)
                    .filter(region => region)
                    .join('\n');
                return `We currently have:\n${regionLines}`;
            }
        }
    }
}

module.exports = RegionAssignment;
