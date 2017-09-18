#!/usr/bin/env node
'use strict';

const Bot = require('./bot/Bot');
const ModuleGuildWars2 = require('./src/modules/guildwars2');
const ModuleModeration = require('./src/modules/moderation');
const ModuleUtilities = require('./src/modules/utilities');

const bot = new Bot();
bot.addModule(ModuleGuildWars2);
bot.addModule(ModuleModeration);
bot.addModule(ModuleUtilities);

(async function () {
    try {
        await bot.start();
    } catch (err) {
        console.error(err.message);
        console.info(err.stack);
        process.exit(err.errno);
    }
})();
