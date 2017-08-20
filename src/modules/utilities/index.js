'use strict';

const Module = require('../../../bot/modules/Module');
const CommandRoll = require('./commands/Roll');
const HookWelcomeNewMember = require('./hooks/WelcomeNewMember');


class ModuleUtilities extends Module {
    constructor(bot) {
        super(bot, 'utilities');

        this.register(new CommandRoll(bot));
        this.register(new HookWelcomeNewMember(bot));
    }
}

module.exports = ModuleUtilities;
