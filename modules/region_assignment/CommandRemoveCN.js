'use strict';

const
    CommandAssignmentBase = require('./CommandAssignmentBase');

class CommandRemoveCN extends CommandAssignmentBase {
    constructor(module, commandConfig) {
        super(module, commandConfig);

        this.id = 'remove_cn';
        this.helpText = 'This allows you to remove yourself from the CN region.';
        this.shortHelpText = 'Remove yourself from the CN region';
    }

    onCommand(response) {
        return this.removeRegionRole(response.message.member, 'cn');
    }
}

module.exports = CommandRemoveCN;
