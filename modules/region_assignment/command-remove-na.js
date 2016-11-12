'use strict';

const
    config = require('config'),

    CommandAssignment = require('./command-assignment');

class CommandRemoveNA extends CommandAssignment {
    constructor(module) {
        super(module);

        this.id = 'remove_na';
        this.name = config.get('modules.region_assignment.na.command_remove');
        this.helpText = 'This allows you to remove yourself from the NA region.';
        this.shortHelpText = 'Remove yourself from the NA region';
    }

    onCommand(message, params) {
        return this.removeRegionRole(message.member, 'na');
    }
}

module.exports = CommandRemoveNA;
