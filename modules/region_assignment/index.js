'use strict';

const
    Module = require('../Module'),
    CommandAssignEU = require('./CommandAssignEU'),
    CommandAssignNA = require('./CommandAssignNA'),
    CommandAssignCN = require('./CommandAssignCN'),
    CommandRemoveEU = require('./CommandRemoveEU'),
    CommandRemoveNA = require('./CommandRemoveNA'),
    CommandRemoveCN = require('./CommandRemoveCN'),
    CommandListNumbers = require('./CommandListNumbers'),
    HookAutomaticAssignment = require('./HookAutomaticAssignment');

class ModuleRegionAssignment extends Module {
    constructor(bot, moduleConfig) {
        super(bot, moduleConfig);

        this.registerCommand(new CommandAssignEU(this));
        this.registerCommand(new CommandAssignNA(this));
        this.registerCommand(new CommandAssignCN(this));
        this.registerCommand(new CommandRemoveEU(this));
        this.registerCommand(new CommandRemoveNA(this));
        this.registerCommand(new CommandRemoveCN(this));
        this.registerCommand(new CommandListNumbers(this));
        this.registerHook(new HookAutomaticAssignment(this));
        this.name = 'Region Assignment';
    }
}

module.exports = ModuleRegionAssignment;
