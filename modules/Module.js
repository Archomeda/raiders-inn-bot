'use strict';

const
    config = require('config'),
    NodeCache = require('node-cache'),
    Promise = require('bluebird'),
    random = require('random-js')(),

    CommandResponse = require('./CommandResponse'),
    RestrictChannelsMiddleware = require('../middleware/RestrictChannelsMiddleware'),
    RestrictPermissionsMiddleware = require('../middleware/internal/RestrictPermissionsMiddleware');

const cache = new NodeCache();

class Module {
    constructor(bot, moduleConfig) {
        if (new.target === Module) {
            throw new TypeError('cannot construct Module instances directly');
        }

        this.name = new.target.name.replace(/(.*?)(Module)?/, '$1');
        this._bot = bot;
        this._config = moduleConfig;
        this._commands = [];
        this._hooks = [];

        this.bot.getClient().on('message', this.onMessage.bind(this));
    }

    get bot() {
        return this._bot;
    }

    get config() {
        return this._config;
    }

    get commands() {
        return this._commands;
    }

    get hooks() {
        return this._hooks;
    }

    registerCommand(command) {
        if (!command.config.enabled) {
            return;
        }
        command.trigger = command.config.trigger;

        const defaultMiddleware = [];
        const configMiddleware = config.get('discord.command_middleware');
        for (let name in configMiddleware) {
            if (configMiddleware.hasOwnProperty(name)) {
                const options = configMiddleware[name];
                const middlewareClass = require(`../middleware/${name}`);
                defaultMiddleware.push(new middlewareClass(options));
            }
        }

        const permissions = config.get('permissions');
        defaultMiddleware.push(new RestrictPermissionsMiddleware({ permissions }));
        command.defaultMiddleware = defaultMiddleware;

        if (command.config.channels && command.config.channels.length > 0) {
            const commandMiddleware = command.middleware;
            const i = commandMiddleware.findIndex(m => m.name === 'RestrictChannelsMiddleware');
            if (i > -1) {
                commandMiddleware[i].options.channels =
                    commandMiddleware[i].options.channels.concat(command.config.channels);
            } else {
                commandMiddleware.push(new RestrictChannelsMiddleware({ types: 'text', channels: command.config.channels }));
            }
            command.middleware = commandMiddleware;
        }

        this._commands.push(command);
    }

    registerHook(hook) {
        if (!hook.config.enabled) {
            return;
        }
        const client = this.bot.getClient();
        for (let hookName in hook.hooks) {
            if (hook.hooks.hasOwnProperty(hookName)) {
                client.on(hookName, hook.hooks[hookName].bind(hook));
            }
        }
        this._hooks.push(hook);
    }

    onMessage(message) {
        let [command, params] = this.parseCommandString(message);

        // If the command is empty, we ignore the message
        if (!command) {
            return;
        }

        let typing = false;
        let response = new CommandResponse(message, command, params);
        // Call middleware onCommand
        this.callMiddlewares('onCommand', response).then(response => {
            if (!response.replyText) {
                // We don't have a reply text yet, so we have to call our command
                if (response.startTypingFunc) {
                    response.startTypingFunc();
                }
                typing = true;
                response.replyText = response.command.onCommand(response);
                if (response.replyText && response.replyText.then) {
                    // Clear the promises
                    return Promise.resolve(response.replyText.then(text => response.replyText = text)).return(response);
                }
            }
            return response;
        }).catch(err => {
            let text = null;
            if (err.name === 'MiddlewareError') {
                // Some middleware has broken our chain, filter error message
                if (err.logger) {
                    console[err.logger](`Middleware error: ${err.message}`);
                }
                text = err.userMessage ? err.userMessage : null;
            } else if (err.name === 'CommandError') {
                // Command error
                console.log(`Caught CommandError on '${message.content}' by '${message.author.username}#${message.author.discriminator}': ${err.message}`);
                text = err.message;
            } else {
                // Unexpected error
                console.warn(`Unexpected error: ${err.message}`);
                console.warn(err.stack);
                text = `An unexpected error has occured, code ${random.hex(6).toUpperCase()}.`;
            }
            const res = new CommandResponse(message, command, params);
            res.replyText = text;
            return res;
        }).then(response => {
            if (response.stopTypingFunc && typing) {
                response.stopTypingFunc();
            }
            if (!response.replyText) {
                return response;
            }

            // Call middleware onResponse
            return this.callMiddlewares('onResponse', response).catch(err => {
                if (err.name === 'MiddlewareError') {
                    // Middleware threw an error, do stuff with it
                    if (err.logger) {
                        console[err.logger](`Middleware error: ${err.message}`);
                    }
                } else {
                    // Unexpected error
                    console.warn(`Unexpected error: ${err.message}`);
                    console.warn(err.stack);
                }
            }).return(response);
        }).then(response => {
            if (response.replyText) {
                let mentions = response.mentions.map(u => u.toString()).join(' ');
                let replyText = response.replyText.replace('{mentions}', mentions);
                if (replyText === response.replyText && response.message.channel.type === 'text') {
                    replyText = `${mentions}, ${replyText}`;
                }
                return response.replyFunc(replyText);
            }
        });
    }

    parseCommandString(message) {
        const messageMatch = message.content.match(new RegExp(`^${config.get('discord.command_prefix')}([^\\s]*)(\\s+(.*))?$`));
        // If there's no likely command match, we return nothing
        if (!messageMatch) {
            return [null, null];
        }
        const trigger = messageMatch[1].toLowerCase();
        const command = this.commands.find(command => command.trigger === trigger);

        // If the command is empty, we return nothing
        if (!command) {
            return [null, null];
        }

        let params = [];
        if (messageMatch[3]) {
            const spl = messageMatch[3].split(' ');
            params = spl.splice(0, command.params.length - 1);
            params.push(spl.join(' '));
        }
        // If the parameter count does not line up, we return nothing
        if (params.length < command.params.filter(param => !param.isOptional).length) {
            return [null, null];
        }

        // Return the parsed command with parameters
        return [command, params.filter(p => p)];
    }

    callMiddlewares(funcName, response) {
        if (response.command.allMiddleware.length === 0) {
            return Promise.resolve(response);
        }

        return new Promise((resolve, reject) => {
            Promise.mapSeries(response.command.allMiddleware, middleware => {
                if (!response.breakMiddleware) {
                    response = middleware[funcName].call(middleware, response);
                }
            }).then(() => resolve(response)).catch(err => reject(err));
        });
    }
}

module.exports = Module;
