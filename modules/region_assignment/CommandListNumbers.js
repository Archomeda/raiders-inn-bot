'use strict';

const
    Command = require('../Command'),
    ReplyToMentionedUsersMiddleware = require('../../middleware/ReplyToMentionedUsersMiddleware'),
    RestrictChannelsMiddleware = require('../../middleware/RestrictChannelsMiddleware');

class CommandListNumbers extends Command {
    constructor(module) {
        super(module);

        this.helpText = 'Gets the amount of users assigned to each region.';
        this.shortHelpText = 'Gets the amount of users assigned to each region';

        this.middleware = [
            new RestrictChannelsMiddleware({ types: 'text' }),
            new ReplyToMentionedUsersMiddleware()
        ];
    }

    onCommand(response) {
        const roles = ['eu', 'na', 'cn', 'unassigned']
            .filter(region => this.module.config.roles[region])
            .map(region => this.module.config.roles[region])
            .concat(this.config.include_roles);

        const lines = roles.map(roleId => response.message.guild.roles.get(roleId))
            .filter(role => role)
            .map(role => role ? `:small_blue_diamond: ${role.name} - ${role.members.size} ${role.members.size === 1 ? 'person' : 'people'}` : null)
            .filter(region => region)
            .join('\n');

        const total = response.message.guild.memberCount;
        return `We currently have ${total} ${total === 1 ? 'person' : 'people'}:\n${lines}`;
    }
}

module.exports = CommandListNumbers;
