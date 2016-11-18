'use strict';

const
    config = require('config'),
    Promise = require('bluebird'),
    i18next = Promise.promisifyAll(require('i18next')),

    Command = require('../Command'),
    CommandParam = require('../CommandParam'),
    CommandError = require('../../errors/CommandError'),
    CacheMiddleware = require('../../middleware/CacheMiddleware'),
    ReplyMethodMiddleware = require('../../middleware/ReplyMethodMiddleware'),
    RestrictPermissionMiddleware = require('../../middleware/internal/RestrictPermissionsMiddleware');

class CommandHelp extends Command {
    constructor(module) {
        super(module);
        i18next.loadNamespacesAsync('general').then(() => {
            this.helpText = i18next.t('general:help.help');
            this.shortHelpText = i18next.t('general:help.short-help');
            this.params = new CommandParam('command', i18next.t('general:help.param-command'), true);
        });

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
                throw new CommandError(i18next.t('general:help.response-command-not-recognized', { command: commandTrigger, help: this.toString() }));
            }
            return i18next.t('general:help.response-single-help', { help: this.formatCommandHelp(response.message, command) });
        } else {
            // Reply with general help
            const help = [];
            modules.forEach(module => {
                const moduleHelp = this.formatModuleHelp(response.message, module);
                if (moduleHelp) {
                    help.push(moduleHelp);
                }
            });
            return i18next.t('general:help.response-all-help', { help: help.join('\n\n') });
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
                        text.push(i18next.t('general:help.command-restriction-dm'));
                        break;
                    case 'text':
                        if (middleware.options.channels.length > 0) {
                            text.push(i18next.t('general:help.command-restriction-specific-channels'));
                        } else {
                            text.push(i18next.t('general:help.command-restriction-channels'));
                        }
                        break;
                }
            }
        }

        middleware = command.allMiddleware.find(m => m.name === 'ReplyToMentionedUsersMiddleware');
        if (middleware) {
            // Mentions are allowed
            if (middleware.options.strict) {
                text.push(i18next.t('general:help.command-restriction-mentions-only'));
            } else {
                text.push(i18next.t('general:help.command-restriction-mentions'));
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

            if (extraText) {
                commands.push(i18next.t('general:help.module-command-help-extra', { command: commandText, help: helpText, extra: extraText }));
            } else {
                commands.push(i18next.t('general:help.module-command-help', { command: commandText, help: helpText }));
            }
        });
        if (commands.length === 0) {
            return;
        }
        return i18next.t('general:help.module-help', { name: module.name, commands: commands.join('\n') });
    }

    formatCommandHelp(message, command) {
        let invocation = `${command}`;
        const helpText = command.helpText;
        const params = [];

        command.params.forEach(param => {
            const paramText = `\`${param.name}\``;
            const helpText = param.helpText;
            const extraText = param.isOptional ? i18next.t('general:help.command-param-restriction-optional') : '';

            if (extraText) {
                params.push(i18next.t('general:help.command-param-help-extra', { param: paramText, help: helpText, extra: extraText }));
            } else {
                params.push(i18next.t('general:help.command-param-help', { param: paramText, help: helpText }));
            }
            invocation += ' ' + (param.isOptional ? i18next.t('general:help.command-param-optional-format', { param: param.name }) : param.name);
        });
        let extraText = this.formatCommandChannelFilter(command);
        // TODO: Find a better way to detect server role assignments in a DM
        if (!RestrictPermissionMiddleware.isCommandAllowed(message, command)) {
            extraText += (extraText ? ', ' : '') + i18next.t('general:help.command-restriction-permissions');
        }

        if (extraText) {
            return i18next.t('general:help.command-help-extra', { command: invocation, help: helpText, params: params.join('\n'), extra: extraText });
        }
        return i18next.t('general:help.command-help', { command: invocation, help: helpText, params: params.join('\n') });
    }
}

module.exports = CommandHelp;
