'use strict';

const
    ModuleBase = require('../module-base'),
    CommandAssignEU = require('./command-assign-eu'),
    CommandAssignNA = require('./command-assign-na'),
    CommandAssignCN = require('./command-assign-cn'),
    CommandRemoveEU = require('./command-remove-eu'),
    CommandRemoveNA = require('./command-remove-na'),
    CommandRemoveCN = require('./command-remove-cn'),
    CommandListNumbers = require('./command-list-numbers');

class ModuleRegionAssignment extends ModuleBase {
    constructor(bot) {
        super(bot);

        this._commands = [
            new CommandAssignEU(this),
            new CommandAssignNA(this),
            new CommandAssignCN(this),
            new CommandRemoveEU(this),
            new CommandRemoveNA(this),
            new CommandRemoveCN(this),
            new CommandListNumbers(this)
        ];
        this.name = 'Region Assignment';
    }
}

module.exports = ModuleRegionAssignment;
