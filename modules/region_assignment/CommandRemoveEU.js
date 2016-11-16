'use strict';

const
    CommandAssignmentBase = require('./CommandAssignmentBase');

class CommandRemoveEU extends CommandAssignmentBase {
    constructor(module) {
        super(module);

        this.helpText = 'This allows you to remove yourself from the EU region.';
        this.shortHelpText = 'Remove yourself from the EU region';
    }

    onCommand(response) {
        return this.removeRegionRole(response.message.member, 'eu');
    }
}

module.exports = CommandRemoveEU;
