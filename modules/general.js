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
            help: 'Shows the link to the source code of this bot.',
            short_help: 'Shows the link to the source code of this bot',
            on_command: () => {
                return 'You can find the source code at https://github.com/Archomeda/raiders-inn-bot.';
            }
        };
    }

    cmd_wiki() {
        return {
            id: config.get('modules.general.command_wiki'),
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
                        text = this.constructor.formatWikiText(text).split('\n')[0].trim();
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

    static formatWikiText(text) {
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
