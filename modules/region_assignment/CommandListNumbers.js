'use strict';

const
    Command = require('../Command'),
    MentionsMiddleware = require('../../middleware/MentionsMiddleware'),
    RestrictChannelsMiddleware = require('../../middleware/RestrictChannelsMiddleware');

class CommandListNumbers extends Command {
    constructor(module, commandConfig) {
        super(module, commandConfig);

        this.id = 'list_numbers';
        this.helpText = 'Gets the amount of users assigned to each region.';
        this.shortHelpText = 'Gets the amount of users assigned to each region';

        this.middleware = [
            new RestrictChannelsMiddleware({ types: 'text' }),
            new MentionsMiddleware({ types: ['reply', 'mention'] })
        ];
    }

    onCommand(response) {
        const regionLines = ['eu', 'na', 'cn']
            .filter(region => this.module.config.roles[region])
            .map(region => response.message.guild.roles.get(this.module.config.roles[region]))
            .map(role => role ? `:small_blue_diamond: ${role.name}: ${role.members.size} ${role.members.size === 1 ? 'person' : 'people'}` : null)
            .filter(region => region)
            .join('\n');
        return `We currently have:\n${regionLines}`;
    }
}

module.exports = CommandListNumbers;
