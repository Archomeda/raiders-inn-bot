'use strict';

const
    config = require('config'),

    CommandAssignment = require('./command-assignment');

class CommandAssignNA extends CommandAssignment {
    constructor(module) {
        super(module);

        this.id = 'assign_na';
        this.name = config.get('modules.region_assignment.na.command_assign');
        this.helpText = 'This allows you to assign yourself to the NA region.';
        this.shortHelpText = 'Assign yourself to the NA region';
    }

    onCommand(message, params) {
        return this.assignRegionRole(message.member, 'na');
    }
}

module.exports = CommandAssignNA;
