'use strict';

const Module = require('../../../bot/modules/Module');
const CommandRegionEu = require('./commands/RegionEu');
const CommandRegionNa = require('./commands/RegionNa');
const CommandWiki = require('./commands/Wiki');
const HookChatCode = require('./hooks/ChatCode');


class ModuleGuildWars2 extends Module {
    constructor(bot) {
        super(bot, 'guildwars2');

        this.register(new CommandRegionEu(bot));
        this.register(new CommandRegionNa(bot));
        this.register(new CommandWiki(bot));
        this.register(new HookChatCode(bot));
    }
}

module.exports = ModuleGuildWars2;
