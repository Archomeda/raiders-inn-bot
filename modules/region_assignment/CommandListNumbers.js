'use strict';

const
    config = require('config'),

    Command = require('../Command'),
    MentionsMiddleware = require('../../middleware/MentionsMiddleware'),
    RestrictChannelsMiddleware = require('../../middleware/RestrictChannelsMiddleware');

class CommandListNumbers extends Command {
    constructor(module) {
        super(module);

        this.id = 'list_numbers';
        this.name = config.get('modules.region_assignment.command_list_numbers');
        this.helpText = 'Gets the amount of users assigned to each region.';
        this.shortHelpText = 'Gets the amount of users assigned to each region';

        this.middleware = [
            new RestrictChannelsMiddleware({ types: 'text' }),
            new MentionsMiddleware({ types: ['reply', 'mention'] })
        ];
    }

    onCommand(message, params) {
        const regionLines = ['eu', 'na', 'cn']
            .filter(region => config.get(`modules.region_assignment.${region}.enabled`))
            .map(region => message.guild.roles.get(config.get(`modules.region_assignment.${region}.role`)))
            .map(role => role ? `:small_blue_diamond: ${role.name}: ${role.members.size} ${role.members.size === 1 ? 'person' : 'people'}` : null)
            .filter(region => region)
            .join('\n');
        return `We currently have:\n${regionLines}`;
    }
}

module.exports = CommandListNumbers;
