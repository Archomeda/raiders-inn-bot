'use strict';

const
    config = require('config'),

    Command = require('../Command'),
    CommandParam = require('../CommandParam'),
    CommandError = require('../../errors/CommandError'),
    CacheMiddleware = require('../../middleware/CacheMiddleware'),
    ReplyMethodMiddleware = require('../../middleware/ReplyMethodMiddleware'),
    RestrictPermissionMiddleware = require('../../middleware/internal/RestrictPermissionsMiddleware');

class CommandHelp extends Command {
    constructor(module, commandConfig) {
        super(module, commandConfig);

        this.id = 'help';
        this.helpText = 'Shows information about how to use commands, with optionally a command as argument to get more detailed information.';
        this.shortHelpText = 'Shows information about how to use commands';
        this.params = new CommandParam('command', 'The command', true);

        this.middleware = [
            new ReplyMethodMiddleware({ method: 'dm' }),
            new CacheMiddleware()
        ];
    }

    onCommand(response) {
        const modules = this.module.bot.getModules();
        const commandPrefix = config.get('discord.command_prefix');

        if (response.params.length > 0) {
            // Reply with help for a specific command
            const commandTrigger = response.params[0].replace(new RegExp(`^${commandPrefix}?(.*)$`), '$1');
            let command;
            for (module of modules) {
                const foundCommand = module.commands.find(command => command.trigger == commandTrigger);
                if (foundCommand) {
                    command = foundCommand;
                    break;
                }
            }

            if (!command) {
                throw new CommandError(`The command \`${command}\` is not recognized. ` +
                    `Type \`${this}\` to see the list of commands.`);
            }
            return `\n${this.formatCommandHelp(response.message, command)}`;
        } else {
            // Reply with general help
            const help = [];
            modules.forEach(module => {
                const moduleHelp = this.formatModuleHelp(response.message, module);
                if (moduleHelp) {
                    help.push(moduleHelp);
                }
            });
            return `\n${help.join('\n\n')}\n\nCommands marked with an asterisk might be restricted.`;
        }
    }

    formatCommandChannelFilter(command) {
        let text = [];

        let middleware = command.allMiddleware.find(m => m.name === 'RestrictChannelsMiddleware');
        if (middleware) {
            // Restricted channels is applied
            if (middleware.options.types.length === 1) {
                switch (middleware.options.types[0]) {
                    case 'dm':
                        text.push('DM only');
                        break;
                    case 'text':
                        if (middleware.options.channels.length > 0) {
                            text.push('specific server channels only');
                        } else {
                            text.push('server channels only');
                        }
                        break;
                }
            }
        }

        middleware = command.allMiddleware.find(m => m.name === 'MentionsMiddleware');
        if (middleware) {
            // Mentions are allowed
            if (middleware.options.types.includes('mention')) {
                if (middleware.options.types.length === 1) {
                    text.push('strictly mentionable');
                } else {
                    text.push('mentionable');
                }
            }
        }
        return text.join(', ');
    }

    formatModuleHelp(message, module) {
        const commands = [];
        module.commands.forEach(command => {
            const commandText = `\`${command}\``;
            const helpText = command.shortHelpText;
            if (!helpText) {
                return;
            }

            let extraText = this.formatCommandChannelFilter(command);
            // TODO: Find a better way to detect server role assignments in a DM
            if (!RestrictPermissionMiddleware.isCommandAllowed(message, command)) {
                extraText += '*';
            }

            const text = extraText ? `${commandText} - ${helpText} *(${extraText})*` : `${commandText} - ${helpText}`;
            commands.push(text);
        });
        if (commands.length === 0) {
            return;
        }
        return `__**${module.name}**__\n${commands.join('\n')}`;
    }

    formatCommandHelp(message, command) {
        let invocation = `${command} `;
        const helpText = command.helpText;
        const params = [];

        command.params.forEach(param => {
            const paramText = `\`${param.name}\``;
            const helpText = param.helpText;
            const text = param.isOptional ? `${paramText} - ${helpText} *(optional)*` : `${paramText} - ${helpText}`;
            params.push(text);
            invocation += (param.isOptional ? '[' : '') + param.name + (param.isOptional ? ']' : '') + ' ';
        });
        let extraText = this.formatCommandChannelFilter(command);
        // TODO: Find a better way to detect server role assignments in a DM
        if (!RestrictPermissionMiddleware.isCommandAllowed(message, command)) {
            extraText += (extraText ? ', ' : '') + 'might be restricted';
        }

        if (extraText) {
            return `\`\`\`${invocation}\`\`\`\n**(${extraText})**\n${helpText}\n\n${params.join('\n')}`;
        }
        return `\`\`\`${invocation}\`\`\`\n${helpText}\n\n${params.join('\n')}`;
    }
}

module.exports = CommandHelp;
