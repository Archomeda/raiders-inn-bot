'use strict';

const
    config = require('config'),

    CommandAssignmentBase = require('./command-assignment-base');

class CommandRemoveEU extends CommandAssignmentBase {
    constructor(module) {
        super(module);

        this.id = 'remove_eu';
        this.name = config.get('modules.region_assignment.eu.command_remove');
        this.helpText = 'This allows you to remove yourself from the EU region.';
        this.shortHelpText = 'Remove yourself from the EU region';
    }

    onCommand(message, params) {
        return this.removeRegionRole(message.member, 'eu');
    }
}

module.exports = CommandRemoveEU;
