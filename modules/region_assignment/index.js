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
    constructor(bot, moduleConfig) {
        super(bot, moduleConfig);

        this.registerCommand(new CommandAssignEU(this, moduleConfig.commands.assign_eu));
        this.registerCommand(new CommandAssignNA(this, moduleConfig.commands.assign_na));
        this.registerCommand(new CommandAssignCN(this, moduleConfig.commands.assign_cn));
        this.registerCommand(new CommandRemoveEU(this, moduleConfig.commands.remove_eu));
        this.registerCommand(new CommandRemoveNA(this, moduleConfig.commands.remove_na));
        this.registerCommand(new CommandRemoveCN(this, moduleConfig.commands.remove_cn));
        this.registerCommand(new CommandListNumbers(this, moduleConfig.commands.list_numbers));
        this.name = 'Region Assignment';
    }
}

module.exports = ModuleRegionAssignment;
