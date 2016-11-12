'use strict';

const
    config = require('config'),
    NodeCache = require('node-cache'),
    Promise = require('bluebird'),

    RestrictPermissionsMiddleware = require('../middleware/internal/RestrictPermissionsMiddleware');

const cache = new NodeCache();

class Module {
    constructor(bot) {
        if (new.target === Module) {
            throw new TypeError('cannot construct Module instances directly');
        }

        this.name = new.target.name.replace(/(.*?)(Module)?/, '$1');
        this._bot = bot;
        this._commands = [];

        this.onMessage = this.onMessage.bind(this);
        this.bot.getClient().on('message', this.onMessage);
    }

    get bot() {
        return this._bot;
    }

    get commands() {
        return this._commands;
    }

    registerCommand(command) {
        const middleware = [];
        const defaultMiddleware = config.get('discord.command_middleware');
        for (let name in defaultMiddleware) {
            if (defaultMiddleware.hasOwnProperty(name)) {
                const options = defaultMiddleware[name];
                const middlewareClass = require(`../middleware/${name}`);
                middleware.push(new middlewareClass(options));
            }
        }

        const permissions = config.get('permissions');
        middleware.push(new RestrictPermissionsMiddleware({ permissions }));
        command.defaultMiddleware = middleware;
        this._commands.push(command);
    }

    onMessage(message) {
        let response;
        let [command, params] = this.parseCommandString(message);

        // If the command is empty, we ignore the message
        if (!command) {
            return;
        }

        // Go through all the applied middleware before executing the command
        let middlewareResult = { message, command, params };
        try {
            for (let middleware of command.middleware) {
                middlewareResult = middleware.onCommand(middlewareResult);
                if (!middlewareResult || !middlewareResult._next) {
                    // No result or don't continue (aka we have a captured response)
                    break;
                }
            }
            if (!middlewareResult) {
                // Middleware cancelled the command execution without an error
                return;
            } else if (middlewareResult._next) {
                message = middlewareResult.message;
                command = middlewareResult.command;
                params = middlewareResult.params;
            } else {
                response = middlewareResult.response;
            }
        } catch (err) {
            if (err.name === 'MiddlewareError') {
                // Middleware threw an error, do stuff with it
                if (err.userMessage) {
                    return message.reply(err.userMessage);
                }
                if (err.logger) {
                    console[err.logger](`Middleware error: ${err.message}`);
                }
            } else {
                // Unexpected error
                console.warn(`Unexpected error: ${err.message}`);
                console.warn(err.stack);
            }
            return;
        }

        // Depending on the delivery method, do stuff
        let sendMessage = () => { };
        let done = false;
        let typing = false;
        if (!done && command.supportedDeliveryTypes.includes('mention')) {
            // 1) Mention people

            // Filter out ourselves
            const mentions = message.mentions.users.filterArray(u => u.id !== this.bot.getClient().user.id);
            if (mentions.length === 0 && command.supportedDeliveryTypes.length === 1) {
                // There are no mentions and only mentioning is possible
                return message.reply(`For this command to work, you have to mention someone with the '@' symbol, like ${this.bot.getClient().user}.`);
            } else if (mentions.length > 0) {
                // There are mentions, let's proceed
                sendMessage = (mentions => {
                    return response => response ? message.channel.sendMessage(`${mentions}, ${response}`) : null;
                })(mentions.join(' '));
                done = true;
                typing = true;
            }
        }
        if (!done && command.supportedDeliveryTypes.includes('text')) {
            // 2) Reply directly to the command executor in the same channel
            sendMessage = response => response ? message.reply(response) : null;
            done = true;
            typing = true;
        }
        if (!done && command.supportedDeliveryTypes.includes('dm')) {
            // 3) Reply by DM
            sendMessage = response => response ? message.author.sendMessage(response) : null;
            done = true;
            typing = message.channel.type === 'dm';
        }

        // Do stuff
        if (done) {
            if (typing) {
                message.channel.startTyping();
            }
            return Promise.try(() => response ? response : command.onCommand(message, params))
                .catch(err => {
                    if (err.name === 'CommandError') {
                        console.log(`Caught CommandError on '${message.content}' by '${message.author.username}#${message.author.discriminator}': ${err.message}`);
                        return err.message;
                    } else {
                        console.warn(`Unexpected error on '${message.content}' by '${message.author.username}#${message.author.discriminator}': ${err.message}`);
                        console.warn(err.stack);
                        return `Failed to execute command: ${err.message}`;
                    }
                })
                .finally(() => {
                    if (typing) {
                        message.channel.stopTyping();
                    }
                }).then(response => {
                    // Go through all the applied middleware after executing the command
                    let middlewareResult = { message, command, params, response };
                    try {
                        for (let middleware of command.middleware) {
                            middlewareResult = middleware.onResponse(middlewareResult);
                            if (!middlewareResult) {
                                // No result or don't continue
                                break;
                            }
                        }
                        if (!middlewareResult) {
                            // Middleware cancelled the command execution without an error
                            return;
                        }
                        response = middlewareResult.response;
                    } catch (err) {
                        if (err.name === 'MiddlewareError') {
                            // Middleware threw an error, do stuff with it
                            if (err.userMessage) {
                                return message.reply(err.userMessage);
                            }
                            if (err.logger) {
                                console[err.logger](`Middleware error: ${err.message}`);
                            }
                        } else {
                            // Unexpected error
                            console.warn(`Unexpected error: ${err.message}`);
                            console.warn(err.stack);
                        }
                        return;
                    }
                    return sendMessage(response);
                });
        }
    }

    parseCommandString(message) {
        const messageMatch = message.content.match(new RegExp(`^${config.get('discord.command_prefix')}([^\\s]*)(\\s+(.*))?$`));
        // If there's no likely command match, we return nothing
        if (!messageMatch) {
            return [null, null];
        }
        const name = messageMatch[1].toLowerCase();
        const command = this.commands.find(command => command.name === name);

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
        return [command, params];
    }
}

module.exports = Module;
