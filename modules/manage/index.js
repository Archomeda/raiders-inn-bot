'use strict';

const
    ModuleBase = require('../module-base'),
    CommandExportIds = require('./command-export-ids');

class ModuleManage extends ModuleBase {
    constructor(bot) {
        super(bot);

        this._commands = [
            new CommandExportIds(this)
        ];
    }
}

module.exports = ModuleManage;
