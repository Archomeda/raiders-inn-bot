'use strict';

const Module = require('../../../bot/modules/Module');
const CommandRaider = require('./commands/Raider');
const CommandWiki = require('./commands/Wiki');
const HookChatCode = require('./hooks/ChatCode');
const HookExperienced = require('./hooks/Experienced');
const WorkerPofCountdown = require('./workers/PofCountdown');


class ModuleGuildWars2 extends Module {
    constructor(bot) {
        super(bot, 'guildwars2');

        this.register(new CommandRaider(bot));
        this.register(new CommandWiki(bot));
        this.register(new HookChatCode(bot));
        this.register(new HookExperienced(bot));
        this.register(new WorkerPofCountdown(bot));
    }
}

module.exports = ModuleGuildWars2;
