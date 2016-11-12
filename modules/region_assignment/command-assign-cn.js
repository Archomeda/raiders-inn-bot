'use strict';

const
    config = require('config'),

    CommandAssignmentBase = require('./command-assignment-base');

class CommandAssignCN extends CommandAssignmentBase {
    constructor(module) {
        super(module);

        this.id = 'assign_cn';
        this.name = config.get('modules.region_assignment.cn.command_assign');
        this.helpText = 'This allows you to assign yourself to the CN region.';
        this.shortHelpText = 'Assign yourself to the CN region';
    }

    onCommand(message, params) {
        return this.assignRegionRole(message.member, 'cn');
    }
}

module.exports = CommandAssignCN;
