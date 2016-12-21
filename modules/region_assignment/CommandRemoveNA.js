'use strict';

const
    CommandAssignmentBase = require('./CommandAssignmentBase');

class CommandRemoveNA extends CommandAssignmentBase {
    constructor(module) {
        super(module);

        this.helpText = 'This allows you to remove yourself from the NA region.';
        this.shortHelpText = 'Remove yourself from the NA region';
    }

    onCommand(response) {
        return this.removeRegionRole(response.message.member, 'na');
    }
}

module.exports = CommandRemoveNA;