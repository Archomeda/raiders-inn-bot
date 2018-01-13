'use strict';

const Module = require('../../../bot/modules/Module');
const CommandGear = require('./commands/Gear');
const CommandHowto = require('./commands/Howto');
const CommandSignup = require('./commands/Signup');
const CommandTimeout = require('./commands/Timeout');
const WorkerExpireTimeout = require('./workers/ExpireTimeout');


class ModuleRaidersInn extends Module {
    constructor(bot) {
        super(bot, 'raidersinn');

        this.register(new CommandGear(bot));
        this.register(new CommandHowto(bot));
        this.register(new CommandSignup(bot));
        this.register(new CommandTimeout(bot));
        this.register(new WorkerExpireTimeout(bot));
    }
}

module.exports = ModuleRaidersInn;
