'use strict';

const
    CommandAssignmentBase = require('./CommandAssignmentBase');

class CommandAssignCN extends CommandAssignmentBase {
    constructor(module) {
        super(module);

        this.helpText = 'This allows you to assign yourself to the CN region.';
        this.shortHelpText = 'Assign yourself to the CN region';
    }

    onCommand(response) {
        return this.assignRegionRole(response.message.member, 'cn');
    }
}

module.exports = CommandAssignCN;
