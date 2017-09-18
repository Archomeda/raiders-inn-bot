'use strict';

const Module = require('../../../bot/modules/Module');
const HookChannelKeeper = require('./hooks/ChannelKeeper');


class ModuleModeration extends Module {
    constructor(bot) {
        super(bot, 'moderation');

        this.register(new HookChannelKeeper(bot));
    }
}

module.exports = ModuleModeration;
