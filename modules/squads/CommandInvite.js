'use strict';

const
    _ = require('lodash'),
    config = require('config'),

    CommandSquadBase = require('./CommandSquadBase'),
    CommandError = require('../../errors/CommandError');

class CommandInvite extends CommandSquadBase {
    constructor(module) {
        super(module);

        this.id = 'invite';
        this.name = config.get('modules.squads.command_invite');
        this.helpText = 'Invites one or more mentioned users to the squad.';
        this.shortHelpText = 'Invites one or more mentioned users to the squad';
        this.listenChannels = config.get('modules.squads.channels');
    }

    onCommand(message, params) {
        if (this.getSquadByChannel(message.channel)) {
            throw new CommandError('This command does not work in squad channels. Please try again in the same channel as where you created the squad.');
        }
        const squad = this.getSquadByMember(message.member);
        if (!squad) {
            throw new CommandError(`You are not part of a squad. ` +
                `You can create one by typing \`${config.get('discord.command_prefix')}${config.get('modules.squads.command_request')}\`.`);
        }
        this.checkLeader(squad, message.member);
        const mentions = this.filterMentionsOutside(squad, message.member, message.mentions.users.array());
        if (mentions.length === 0) {
            throw new CommandError(`This command will only work if you mention one or more people, like ${message.author}.`);
        }
        return Promise.mapSeries(mentions, user => message.guild.fetchMember(user))
            .then(members => {
                const invitableMembers = members.filter(member => !this.getSquadByMember(member));
                const uninvitableMembers = _.difference(members, invitableMembers);

                if (invitableMembers.length > 0) {
                    return squad.addMembers(invitableMembers)
                        .then(() => {
                            const textChannel = message.guild.channels.get(squad.textChannel);
                            return textChannel.sendMessage(`${message.member} has invited ${invitableMembers.join(', ')} to the squad.`)
                        })
                        .then(() => {
                            return `The following people have been invited: ${invitableMembers.join(', ')}.` +
                                (uninvitableMembers.length > 0 ? ` ${uninvitableMembers.join(', ')} could not be invited because they are part of a squad already.` : '');
                        });
                } else if (uninvitableMembers.length > 0) {
                    return `${uninvitableMembers.join(', ')} could not be invited because they are part of a squad already.`;
                }
            });
    }
}

module.exports = CommandInvite;
