'use strict';

const
    config = require('config'),
    random = require('random-js')(),

    Command = require('../Command'),
    CommandParam = require('../CommandParam'),
    CommandError = require('../../errors/CommandError');

class CommandRoll extends Command {
    constructor(module) {
        super(module);

        this.id = 'roll';
        this.name = config.get('modules.utilities.command_roll');
        this.helpText = 'Rolls one or more dice and gives the result.';
        this.shortHelpText = 'Rolls one or more dice';
        this.params = [
            new CommandParam('die', 'The die you want to use (d2 - d100)', true),
            new CommandParam('rolls', 'The number of rolls (1 - 10)', true)
        ];
    }

    onCommand(message, params) {
        let die = 6;
        let rolls = 1;
        if (params) {
            if (params.length > 0) {
                const match = params[0].match(/d(\d+)/);
                die = match ? parseInt(match[1]) || die : 0;
            }
            if (params.length > 1) {
                rolls = parseInt(params[1]) || rolls;
            }
        }
        if (!die || die < 2 || die > config.get('modules.utilities.roll_max_dice')) {
            throw new CommandError('The die has to be between d2 and d100.');
        }
        if (!rolls || rolls < 1 || rolls > config.get('modules.utilities.roll_max_rolls')) {
            throw new CommandError('You can only roll between 1 and 10 times.');
        }

        const result = random.dice(die, rolls);

        const generateSymbols = index => {
            const black = ':black_medium_small_square:';
            const white = ':white_medium_small_square:';
            return (
                `${index % 4 === 0 ? black : white} ` +
                `${index % 4 === 1 || index % 4 === 3 ? black : white} ` +
                `${index % 4 === 2 ? black : white}`
            );
        };

        message.channel.sendMessage(`${message.author} is rolling ${generateSymbols(0)}`).then(messageEdit => {
            const update = ((message, result, receiver, i) => () => {
                if (i < 5) {
                    message.edit(`${receiver} is rolling ${generateSymbols(i)}`);
                    setTimeout(update, 600);
                    i++;
                } else {
                    message.edit(`${receiver} has rolled ${result.join(', ')}.`);
                }
            })(messageEdit, result, message.author, 1);
            setTimeout(update, 600);
        });
    }
}

module.exports = CommandRoll;
