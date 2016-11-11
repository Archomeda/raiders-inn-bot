'use strict';

const
    MWBot = require('mwbot'),
    config = require('config'),
    toMarkdown = require('to-markdown'),

    CommandBase = require('../command-base'),
    CommandParam = require('../command-param'),
    CommandError = require('../errors/CommandError');

const wiki = new MWBot({
    apiUrl: 'https://wiki.guildwars2.com/api.php'
});

class CommandWiki extends CommandBase {
    constructor(module) {
        super(module);

        this.id = 'wiki';
        this.name = config.get('modules.general.command_wiki');
        this.helpText = 'Searches the Guild Wars 2 Wiki for an article and returns a summary and the article link if found.';
        this.shortHelpText = 'Searches the Guild Wars 2 Wiki for an article';
        this.cooldownType = 'user';
        this.listenChannelTypes = 'text';
        this.params = new CommandParam('terms', 'Search terms');
    }

    onCommand(message, params) {
        if (!params || params.length === 0) {
            throw new CommandError('Please provide a wiki article title or search terms.');
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
            if (response && response.parse.text['*']) {
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
                    throw new CommandError('Your request did not come up with any results. Try using different search terms.');
                case 'no title':
                    throw new CommandError('Please provide a wiki article title or search terms.');
                default:
                    throw err;
            }
        });
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

module.exports = CommandWiki;
