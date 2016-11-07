'use strict';

const
    config = require('config'),
    moment = require('moment-timezone'),
    BaseModule = require('./base_module');

class GeneralModule extends BaseModule {
    constructor(bot, config) {
        super(bot, config);
        this.name = 'General';
    }

    cmd_help() {
        return {
            id: config.get('modules.general.command_help'),
            deliver: config.get('modules.general.deliver_help'),
            help: 'Shows information about how to use commands, with optionally a command as argument to get more detailed information.',
            short_help: 'Shows information about how to use commands',
            params: [
                {
                    id: 'id',
                    help: 'The command',
                    optional: true
                }
            ],
            on_command: (message, params) => {
                const modules = this.bot.getModules();

                if (params.length > 0) {
                    // Reply with help for a specific command
                    const commandId = params[0].replace(new RegExp(`^${config.get('discord.command-prefix')}?(.*)$`), '$1');
                    let command;
                    for (module of modules) {
                        const foundCommand = module.commands.find(command => command.id == commandId);
                        if (foundCommand) {
                            command = foundCommand;
                            break;
                        }
                    }

                    if (!command) {
                        return `I do not recognize the command \`${config.get('discord.command-prefix')}${commandId}\`.` +
                            `Type \`${config.get('discord.command-prefix')}${config.get('modules.general.command_help')}\` to see the list of commands.`;
                    }
                    return `\n${this.constructor.formatCommandHelp(command)}`;
                } else {
                    // Reply with general help
                    const help = [];
                    modules.forEach(module => {
                        const moduleHelp = this.constructor.formatModuleHelp(module);
                        if (moduleHelp) {
                            help.push(moduleHelp);
                        }
                    });
                    return `\n${help.join('\n\n')}`;
                }
            }
        };
    }

    cmd_sourceCode() {
        return {
            id: config.get('modules.general.command_source'),
            help: 'Shows the URL of the source code of this bot.',
            short_help: 'Shows the URL of the source code of this bot',
            on_command: () => {
                return 'You can find the source code at https://github.com/Archomeda/raiders-inn-bot.';
            }
        };
    }

    cmd_resetTime() {
        return {
            id: config.get('modules.general.command_reset'),
            help: 'Shows the current raid reset time and how much time there is left until the reset happens. This will also show a link to the wiki containing all Guild Wars 2 reset times.',
            short_help: 'Shows the raid reset time',
            on_command: () => {
                const nextReset = moment().utc().day(8).hour(7).minute(30);
                const timezones = [
                    'America - Los Angeles',
                    'America - New York',
                    'Europe - London',
                    'Europe - Paris',
                    'Australia - Sydney',
                    'Asia - Tokyo'
                ];
                return `Reset will happen ${moment().to(nextReset)}.\n\n` +
                    `Raid rewards reset every ${nextReset.format('dddd [at] H:mm')} UTC. Other timezones:\n` +
                    timezones.map(time => `:small_blue_diamond: ${time}: ${nextReset.clone().tz(time.replace(' - ', '/').replace(' ', '_')).format('dddd [at] H:mm')}`).join('\n') + '\n\n' +
                    'For a full overview, check the wiki: https://wiki.guildwars2.com/wiki/Server_reset';
            }
        }
    }

    static formatCommandChannelFilter(command) {
        if (command.channel_type) {
            if (command.channel_type.indexOf('dm') > -1 && command.channel_type.indexOf('text') === -1) {
                return 'DM only';
            } else if (command.channel_type.indexOf('dm') === -1 && command.channel_type.indexOf('text') > -1) {
                if (command.channels && command.channels.length > 0) {
                    return 'specific text channels only';
                } else {
                    return 'text channels only';
                }
            }
        }
    }

    static formatModuleHelp(module) {
        const name = module.name || module.constructor.name.replace(/(.*?)(Module)?/, '$1');
        const commands = [];
        module.commands.forEach(command => {
            const commandText = `\`${config.get('discord.command-prefix')}${command.id}\``;
            const helpText = command.short_help;
            if (!helpText) return;

            let text;
            if (command.channel_type && command.channel_type.length > 0) {
                const extraText = this.formatCommandChannelFilter(command);
                text = `${commandText} - ${helpText} *(${extraText})*`;
            } else {
                text = `${commandText} - ${helpText}`;
            }
            commands.push(text);
        });
        if (commands.length === 0) {
            return;
        }
        return `__**${name}**__\n${commands.join('\n')}`;
    }

    static formatCommandHelp(command) {
        let invocation = `${config.get('discord.command-prefix')}${command.id} `;
        const params = [];
        if (command.params) {
            command.params.forEach(param => {
                const paramText = `\`${param.id}\``;
                const helpText = param.help;
                let text;
                if (param.optional) {
                    const extraText = 'optional';
                    text = `${paramText} - ${helpText} *(${extraText})*`;
                } else {
                    text = `${paramText} - ${helpText}`;
                }
                params.push(text);
                invocation += (param.optional ? '[' : '') + param.id + (param.optional ? ']' : '') + ' ';
            });
        }
        const extraText = this.formatCommandChannelFilter(command);
        if (extraText) return `\`\`\`${invocation}\`\`\`\n**(${extraText})**\n${command.help}\n\n${params.join('\n')}`;
        else return `\`\`\`${invocation}\`\`\`\n${command.help}\n\n${params.join('\n')}`;
    }
}

module.exports = GeneralModule;
