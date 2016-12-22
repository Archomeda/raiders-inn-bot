'use strict';

const
    Promise = require('bluebird'),
    i18next = Promise.promisifyAll(require('i18next')),

    Command = require('../Command'),
    ReplyToMentionedUsersMiddleware = require('../../middleware/ReplyToMentionedUsersMiddleware'),
    RestrictChannelsMiddleware = require('../../middleware/RestrictChannelsMiddleware');

class CommandListNumbers extends Command {
    constructor(module) {
        super(module);
        i18next.loadNamespacesAsync('region-assignment').then(() => {
            this.helpText = i18next.t('region-assignment:list-numbers.help');
            this.shortHelpText = i18next.t('region-assignment:list-numbers.short-help');
        });

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
            .map(role => role ? i18next.t('region-assignment:list-numbers.partial-response-role', { name: role.name, count: role.members.size }) : null)
            .filter(region => region)
            .join('\n');

        const total = response.message.guild.memberCount;
        return i18next.t('region-assignment:list-numbers.response', { count: total, roles: lines });
    }
}

module.exports = CommandListNumbers;
