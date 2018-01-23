'use strict';

const Module = require('../../../bot/modules/Module');
const CommandExperienced = require('./commands/Experienced');
const CommandFractals = require('./commands/Fractals');
const CommandRaider = require('./commands/Raider');
const CommandWiki = require('./commands/Wiki');
const HookChatCode = require('./hooks/ChatCode');
const HookExperienced = require('./hooks/Experienced');
const HookRoleAssignment = require('./hooks/RoleAssignment');


class ModuleGuildWars2 extends Module {
    constructor(bot) {
        super(bot, 'guildwars2');

        this.register(new CommandExperienced(bot));
        this.register(new CommandFractals(bot));
        this.register(new CommandRaider(bot));
        this.register(new CommandWiki(bot));
        this.register(new HookChatCode(bot));
        this.register(new HookExperienced(bot));
        this.register(new HookRoleAssignment(bot));
    }
}

module.exports = ModuleGuildWars2;
