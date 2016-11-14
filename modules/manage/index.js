'use strict';

const
    Module = require('../Module'),
    CommandExportIds = require('./CommandExportIds');

class ModuleManage extends Module {
    constructor(bot, moduleConfig) {
        super(bot, moduleConfig);

        this.registerCommand(new CommandExportIds(this, moduleConfig.commands.export_ids));
    }
}

module.exports = ModuleManage;
