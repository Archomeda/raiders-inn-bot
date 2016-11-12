'use strict';

const
    config = require('config'),

    CommandBase = require('../command-base'),
    CommandParam = require('../command-param'),
    CommandError = require('../errors/CommandError');

class CommandSource extends CommandBase {
    constructor(module) {
        super(module);

        this.id = 'help';
        this.name = config.get('modules.general.command_help');
        this.helpText = 'Shows information about how to use commands, with optionally a command as argument to get more detailed information.';
        this.shortHelpText = 'Shows information about how to use commands';
        this.cooldownType = 'none';
        this.supportedDeliveryTypes = config.get('modules.general.deliver_help');
        this.params = new CommandParam('command', 'The command', true);
    }

    onCommand(message, params) {
        const modules = this.module.bot.getModules();
        const commandPrefix = config.get('discord.command_prefix');

        if (params.length > 0) {
            // Reply with help for a specific command
            const commandName = params[0].replace(new RegExp(`^${commandPrefix}?(.*)$`), '$1');
            let command;
            for (module of modules) {
                const foundCommand = module.commands.find(command => command.name == commandName);
                if (foundCommand) {
                    command = foundCommand;
                    break;
                }
            }

            if (!command) {
                throw new CommandError(`The command \`${commandPrefix}${commandName}\` is not recognized.` +
                    `Type \`${commandPrefix}${this.name}\` to see the list of commands.`);
            }
            return `\n${this.formatCommandHelp(message, command)}`;
        } else {
            // Reply with general help
            const help = [];
            modules.forEach(module => {
                const moduleHelp = this.formatModuleHelp(message, module);
                if (moduleHelp) {
                    help.push(moduleHelp);
                }
            });
            return `\n${help.join('\n\n')}\n\nCommands marked with an asterisk might be restricted.`;
        }
    }

    formatCommandChannelFilter(command) {
        let text = [];
        if (command.listenChannelTypes.includes('dm') && command.listenChannelTypes.length === 1) {
            text.push('DM only');
        } else if (command.listenChannelTypes.includes('text') && command.listenChannelTypes.length === 1) {
            if (command.listenChannels.length > 0) {
                text.push('specific server channels only');
            } else {
                text.push('server channels only');
            }
        }
        if (command.supportedDeliveryTypes.includes('mention')) {
            text.push('mentionable');
        }
        return text.join(', ');
    }

    formatModuleHelp(message, module) {
        const commands = [];
        module.commands.forEach(command => {
            const commandText = `\`${config.get('discord.command_prefix')}${command.name}\``;
            const helpText = command.shortHelpText;
            if (!helpText) {
                return;
            }

            let extraText = this.formatCommandChannelFilter(command);
            // TODO: Find a better way to detect server role assignments in a DM
            if (!this.module.checkCommandPermission(message, command)) {
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
        let invocation = `${config.get('discord.command_prefix')}${command.name} `;
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
        if (!this.module.checkCommandPermission(message, command)) {
            extraText += (extraText ? ', ' : '') + 'might be restricted';
        }

        if (extraText) {
            return `\`\`\`${invocation}\`\`\`\n**(${extraText})**\n${helpText}\n\n${params.join('\n')}`;
        }
        return `\`\`\`${invocation}\`\`\`\n${helpText}\n\n${params.join('\n')}`;
    }
}

module.exports = CommandSource;
