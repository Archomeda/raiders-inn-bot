'use strict';

const
    random = require('random-js')(),
    Promise = require('bluebird'),
    i18next = Promise.promisifyAll(require('i18next')),

    Command = require('../Command'),
    CommandParam = require('../CommandParam'),
    CommandError = require('../../errors/CommandError');

class CommandRoll extends Command {
    constructor(module) {
        super(module);
        i18next.loadNamespacesAsync('utilities').then(() => {
            this.helpText = i18next.t('utilities:roll.help');
            this.shortHelpText = i18next.t('utilities:roll.short-help');
            this.params = new CommandParam('die', i18next.t('utilities:roll.param-die'), true);
            this.params = new CommandParam('rolls', i18next.t('utilities:roll.param-rolls'), true);
        });
    }

    onCommand(response) {
        let die = 6;
        let rolls = 1;
        if (response.params) {
            if (response.params.length > 0) {
                const match = response.params[0].match(/d(\d+)/);
                die = match ? parseInt(match[1]) || die : 0;
            }
            if (response.params.length > 1) {
                rolls = parseInt(response.params[1]) || rolls;
            }
        }
        if (!die || die < 2 || die > this.config.roll_max_die) {
            throw new CommandError(i18next.t('utilities:roll.response-die-out-of-range'));
        }
        if (!rolls || rolls < 1 || rolls > this.config.roll_max_rolls) {
            throw new CommandError(i18next.t('utilities:roll.response-rolls-out-of-range'));
        }

        const result = random.dice(die, rolls);

        const generateSymbols = index => {
            const black = '◾';
            const white = '◽';
            return (
                `${index % 4 === 0 ? black : white} ` +
                `${index % 4 === 1 || index % 4 === 3 ? black : white} ` +
                `${index % 4 === 2 ? black : white}`
            );
        };

        response.message.channel.sendMessage(i18next.t('utilities:roll.response-rolling', {
            member: response.message.author.toString(),
            symbols: generateSymbols(0)
        })).then(messageEdit => {
            const update = ((message, result, receiver, i) => () => {
                if (i < 5) {
                    message.edit(i18next.t('utilities:roll.response-rolling', {
                        member: receiver.toString(),
                        symbols: generateSymbols(i)
                    }));
                    setTimeout(update, 600);
                    i++;
                } else {
                    message.edit(i18next.t('utilities:roll.response', {
                        member: receiver.toString(),
                        result: result.join(', ')
                    }));
                }
            })(messageEdit, result, response.message.author, 1);
            setTimeout(update, 600);
        });
    }
}

module.exports = CommandRoll;
