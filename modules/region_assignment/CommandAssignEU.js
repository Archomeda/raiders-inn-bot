'use strict';

const
    CommandAssignmentBase = require('./CommandAssignmentBase');

class CommandAssignEU extends CommandAssignmentBase {
    constructor(module) {
        super(module);

        this.helpText = 'This allows you to assign yourself to the EU region.';
        this.shortHelpText = 'Assign yourself to the EU region';
    }

    onCommand(response) {
        return this.assignRegionRole(response.message.member, 'eu');
    }
}

module.exports = CommandAssignEU;
