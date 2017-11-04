#!/usr/bin/env node
'use strict';

const Bot = require('./bot/Bot');
const ModuleGuildWars2 = require('./src/modules/guildwars2');
const ModuleModeration = require('./src/modules/moderation');
const ModuleRaidersInn = require('./src/modules/raidersinn');
const ModuleUtilities = require('./src/modules/utilities');

const bot = new Bot();
bot.addModule(ModuleGuildWars2);
bot.addModule(ModuleModeration);
bot.addModule(ModuleRaidersInn);
bot.addModule(ModuleUtilities);

async function stop() {
    await bot.stop();
    process.exit();
}

process.on('warning', e => {
    console.warn(`${e.name}: ${e.message}`);
    console.warn(e.stack);
});

process.on('SIGTERM', stop);
process.on('SIGINT', stop);

(async function () {
    try {
        await bot.start();
    } catch (err) {
        console.error(err.message);
        console.info(err.stack);
        process.exit(err.errno);
    }
})();
