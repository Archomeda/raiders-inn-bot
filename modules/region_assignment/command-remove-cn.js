'use strict';

const
    config = require('config'),

    CommandAssignmentBase = require('./command-assignment-base');

class CommandRemoveCN extends CommandAssignmentBase {
    constructor(module) {
        super(module);

        this.id = 'remove_cn';
        this.name = config.get('modules.region_assignment.cn.command_remove');
        this.helpText = 'This allows you to remove yourself from the CN region.';
        this.shortHelpText = 'Remove yourself from the CN region';
    }

    onCommand(message, params) {
        return this.removeRegionRole(message.member, 'cn');
    }
}

module.exports = CommandRemoveCN;
