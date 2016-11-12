'use strict';

const
    config = require('config'),

    CommandAssignment = require('./command-assignment');

class CommandAssignEU extends CommandAssignment {
    constructor(module) {
        super(module);

        this.id = 'assign_eu';
        this.name = config.get('modules.region_assignment.eu.command_assign');
        this.helpText = 'This allows you to assign yourself to the EU region.';
        this.shortHelpText = 'Assign yourself to the EU region';
    }

    onCommand(message, params) {
        return this.assignRegionRole(message.member, 'eu');
    }
}

module.exports = CommandAssignEU;
