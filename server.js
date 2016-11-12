#!/usr/bin/env node
'use strict';

require('babel-polyfill');

const
    config = require('config'),
    Discord = require('discord.js'),
    Promise = require('bluebird'),
    ModuleBase = require('./modules/Module');

console.log('Starting bot...');

const client = new Discord.Client();
const moduleConfigs = config.get('modules');
const modules = [];

const bot = {
    getClient() { return client; },
    getModules() { return modules; }
};

Promise.map(Object.keys(moduleConfigs), m => {
    const moduleConfig = moduleConfigs[m];
    if (!moduleConfig.enabled) return;
    return new Promise(resolve => {
        try {
            const Module = require(`./modules/${m}`);
            if (Module.prototype instanceof ModuleBase) {
                modules.push(new Module(bot, moduleConfig, m));
                console.log(`Module '${m}' loaded`);
            } else {
                console.warn(`Module '${m}' does not export a class that extends ModuleBase, skipping`);
            }
        } catch(err) {
            console.warn(`Module '${m}' could not be loaded: ${err.message}`);
        }
        resolve();
    })
}).then(() => {
    client.on('ready', () => {
        const guilds = client.guilds.array().map(g => g.name);
        const clientId = client.user.id;
        console.log(`Registered Discord guilds: ${guilds.join(', ')}`);
        console.info(`The following URL can be used to register the bot to a Discord guild: https://discordapp.com/oauth2/authorize?client_id=${clientId}&scope=bot&permissions=8`);

        console.info('Ready');
    });

    client.on('guildCreate', guild => {
        console.log(`Joined Discord guild ${guild.name}`);
    });
    client.on('disconnect', () => {
        console.info('Disconnected from Discord');
    });

    client.on('reconnecting', () => {
        console.info('Reconnecting to Discord');
    });
    client.on('error', err => {
        console.warn(`Discord error: ${err.message}`);
    });

    console.log('Connecting to Discord...');
    client.login(config.get('discord.token'))
        .then(() => console.log('Connected'))
        .catch(err => console.error(`Could not connect to Discord: ${err.message}`));
});
