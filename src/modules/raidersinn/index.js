'use strict';

const Module = require('../../../bot/modules/Module');
const CommandGear = require('./commands/Gear');
const CommandHowto = require('./commands/Howto');


class ModuleRaidersInn extends Module {
    constructor(bot) {
        super(bot, 'raidersinn');

        this.register(new CommandGear(bot));
        this.register(new CommandHowto(bot));
    }
}

module.exports = ModuleRaidersInn;