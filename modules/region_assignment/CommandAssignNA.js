'use strict';

const
    CommandAssignmentBase = require('./CommandAssignmentBase');

class CommandAssignNA extends CommandAssignmentBase {
    constructor(module) {
        super(module);

        this.helpText = 'This allows you to assign yourself to the NA region.';
        this.shortHelpText = 'Assign yourself to the NA region';
    }

    onCommand(response) {
        return this.assignRegionRole(response.message.member, 'na');
    }
}

module.exports = CommandAssignNA;
