'use strict';

const
    MWBot = require('mwbot'),
    config = require('config'),
    toMarkdown = require('to-markdown'),
    BaseModule = require('./base_module');

const wiki = new MWBot({
    apiUrl: 'https://wiki.guildwars2.com/api.php'
});

class GeneralModule extends BaseModule {
    constructor(bot, config, filename) {
        super(bot, config, filename);
        this.name = 'General';
    }

    cmd_help() {
        return {
            id: 'help',
            command: config.get('modules.general.command_help'),
            deliver: config.get('modules.general.deliver_help'),
            cooldown: 'user',
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
                    const commandName = params[0].replace(new RegExp(`^${config.get('discord.command_prefix')}?(.*)$`), '$1');
                    let command;
                    for (module of modules) {
                        const foundCommand = module.commands.find(command => command.command == commandName);
                        if (foundCommand) {
                            command = foundCommand;
                            command.filename = module.filename;
                            break;
                        }
                    }

                    // TODO: Disabled for now as I don't have a way to detect server role assignments in a DM yet... (they are separate)
                    //if (!this.checkPermission(message, `${command.filename}.${command.id}`)) return;

                    if (!command) {
                        return `I do not recognize the command \`${config.get('discord.command_prefix')}${commandName}\`.` +
                            `Type \`${config.get('discord.command_prefix')}${config.get('modules.general.command_help')}\` to see the list of commands.`;
                    }
                    return `\n${this.formatCommandHelp(command)}`;
                } else {
                    // Reply with general help
                    const help = [];
                    modules.forEach(module => {
                        const moduleHelp = this.formatModuleHelp(message, module);
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
            id: 'source',
            command: config.get('modules.general.command_source'),
            cooldown: 'global',
            help: 'Shows the link to the source code of this bot.',
            short_help: 'Shows the link to the source code of this bot',
            on_command: () => {
                return 'You can find the source code at https://github.com/Archomeda/raiders-inn-bot.';
            }
        };
    }

    cmd_welcome() {
        return {
            id: 'welcome',
            command: config.get('modules.general.command_welcome'),
            deliver: 'mention',
            cooldown: 'user',
            help: 'Welcomes a person to the server and directs him or her to the read first channel.',
            short_help: 'Welcomes a person to the server',
            channel_type: 'text',
            on_command: message => {
                return (
                    `Welcome to The Raiders Inn! Be sure to head over to ${message.guild.channels.get(config.get('modules.general.welcome_channel'))} to get started. ` +
                    "Our rules and general information is listed there. Don't forget to assign yourself to a server!\n\nEnjoy your stay!"
                );
            }
        };
    }

    cmd_wiki() {
        return {
            id: 'wiki',
            command: config.get('modules.general.command_wiki'),
            cooldown: 'user',
            help: 'Searches the wiki for an article and returns a summary and the article link if found.',
            short_help: 'Searches the wiki for an article',
            params: [
                {
                    id: 'terms',
                    help: 'Search terms'
                }
            ],
            on_command: (message, params) => {
                if (!params || params.length === 0) {
                    return 'Please provide a wiki article title or search terms.';
                }
                const terms = params[0];

                // Search with nearmatch first
                return wiki.request({
                    action: 'query',
                    list: 'search',
                    srsearch: terms,
                    srwhat: 'nearmatch'
                }).then(response => {
                    if (response && response.query.search.length > 0) {
                        return response;
                    }

                    // No results, search with title
                    return wiki.request({
                        action: 'query',
                        list: 'search',
                        srsearch: terms,
                        srwhat: 'title'
                    });
                }).then(response => {
                    if (response && response.query.search.length > 0) {
                        // Found our article, get it
                        return wiki.request({
                            action: 'parse',
                            page: response.query.search[0].title,
                            redirects: true,
                            prop: 'text'
                        });
                    }
                }).catch(err => {
                    // Make sure we have sane errors
                    if (err.code === 'missingtitle') {
                        throw new Error('not found');
                    } else if (err.info) {
                        throw new Error(err.info);
                    }
                    throw err;
                }).then(response => {
                    if (response.parse.text['*']) {
                        // We have our article
                        let text = response.parse.text['*'];
                        const title = response.parse.title;

                        // Construct message
                        text = this.formatWikiText(text).split('\n')[0].trim();
                        const url = encodeURI(`https://wiki.guildwars2.com/wiki/${title}`);
                        if (text) {
                            text += `\n\nMore: ${url}`;
                        } else {
                            text = `${title}: ${url}`;
                        }
                        return text;
                    }
                    throw new Error('not found');
                }).catch(err => {
                    // Capture errors and construct proper fail message
                    switch (err.message) {
                        case 'not found':
                            return 'Your request did not come up with any results. Try using different search terms.';
                        case 'no title':
                            return 'Please provide a wiki article title or search terms.';
                        default:
                            throw err;
                    }
                });
            }
        }
    }

    formatCommandChannelFilter(command) {
        if (command.channel_type) {
            if (command.channel_type.indexOf('dm') > -1 && command.channel_type.indexOf('text') === -1) {
                return 'DM only';
            } else if (command.channel_type.indexOf('dm') === -1 && command.channel_type.indexOf('text') > -1) {
                if (command.channels && command.channels.length > 0) {
                    return 'specific server channels only';
                } else {
                    return 'server channels only';
                }
            }
        }
    }

    formatModuleHelp(message, module) {
        const name = module.name || module.constructor.name.replace(/(.*?)(Module)?/, '$1');
        const commands = [];
        module.commands.forEach(command => {
            // TODO: Disabled for now as I don't have a way to detect server role assignments in a DM yet... (they are separate)
            //if (!this.checkPermission(message, `${module.filename}.${command.id}`)) return;

            const commandText = `\`${config.get('discord.command_prefix')}${command.command}\``;
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

    formatCommandHelp(command) {
        let invocation = `${config.get('discord.command_prefix')}${command.command} `;
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

    formatWikiText(text) {
        return toMarkdown(text, {
            converters: [
                {
                    // Convert various stuff to plain-text
                    filter: ['a', 'small', 'span'],
                    replacement: (innerHTML, node) => node.style.display !== 'none' ? innerHTML : ''
                },
                {
                    // Filter out all unwanted tags
                    filter: node => !node.nodeName.match(/^(b|strong|i|em|s|del|p)$/i),
                    replacement: () => ''
                }
            ]
        })
    }
}

module.exports = GeneralModule;
