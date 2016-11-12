'use strict';

const
    ModuleBase = require('../Module'),
    CommandAssignEU = require('./CommandAssignEU'),
    CommandAssignNA = require('./CommandAssignNA'),
    CommandAssignCN = require('./CommandAssignCN'),
    CommandRemoveEU = require('./CommandRemoveEU'),
    CommandRemoveNA = require('./CommandRemoveNA'),
    CommandRemoveCN = require('./CommandRemoveCN'),
    CommandListNumbers = require('./CommandListNumbers');

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
