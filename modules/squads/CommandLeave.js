'use strict';

const
    config = require('config'),
    Promise = require('bluebird'),
    i18next = Promise.promisifyAll(require('i18next')),

    CommandSquadBase = require('./CommandSquadBase'),
    CommandError = require('../../errors/CommandError');

class CommandLeave extends CommandSquadBase {
    constructor(module) {
        super(module);
        i18next.loadNamespacesAsync('squads').then(() => {
            this.helpText = i18next.t('squads:leave.help');
            this.shortHelpText = i18next.t('squads:leave.short-help');
        });
    }

    onCommand(response) {
        const squad = this.checkSquadChannel(response.message.channel);
        console.log(squad.leader, response.message.author.id);
        if (squad.leader === response.message.member.id) {
            throw new CommandError(i18next.t('squads:leave.response-leader', {
                command_transfer: `${config.get('discord.command_prefix')}${this.module.config.commands.transfer.trigger}`,
                command_disband: `${config.get('discord.command_prefix')}${this.module.config.commands.disband.trigger}`
            }));
        }
        const textChannel = response.message.guild.channels.get(squad.textChannel);
        return textChannel.sendMessage(i18next.t('squads:leave.message-left', { member: response.message.member.toString() }))
            .then(() => squad.removeMember(response.message.member));
    }
}

module.exports = CommandLeave;
