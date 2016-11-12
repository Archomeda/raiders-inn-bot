'use strict';

const
    Module = require('../Module'),
    CommandExportIds = require('./CommandExportIds');

class ModuleManage extends Module {
    constructor(bot) {
        super(bot);

        this._commands = [
            new CommandExportIds(this)
        ];
    }
}

module.exports = ModuleManage;
