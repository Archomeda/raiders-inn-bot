'use strict';

const
    _ = require('lodash'),
    config = require('config'),
    Promise = require('bluebird'),

    CommandSquadBase = require('./CommandSquadBase'),
    CommandError = require('../../errors/CommandError'),
    MentionsMiddleware = require('../../middleware/MentionsMiddleware');

class CommandInvite extends CommandSquadBase {
    constructor(module) {
        super(module);

        this.helpText = 'Invites one or more mentioned users to the squad.';
        this.shortHelpText = 'Invites one or more mentioned users to the squad';

        // Overwrite middleware
        this.middleware = new MentionsMiddleware({ types: 'mention' });
    }

    onCommand(response) {
        const squad = this.getSquadByMember(response.message.member);
        if (!squad) {
            throw new CommandError(`You are not part of a squad. ` +
                `You can create one by typing \`${config.get('discord.command_prefix')}${this.module.config.commands.request.trigger}\`.`);
        }
        this.checkLeader(squad, response.message.member);
        return Promise.mapSeries(response.mentions, user => response.message.guild.fetchMember(user))
            .then(members => {
                const invitableMembers = members.filter(member => !this.getSquadByMember(member));
                const uninvitableMembers = _.difference(members, invitableMembers);

                if (invitableMembers.length > 0) {
                    return squad.addMembers(invitableMembers)
                        .then(() => {
                            const textChannel = response.message.guild.channels.get(squad.textChannel);
                            return textChannel.sendMessage(`${response.message.member} has invited ${invitableMembers.join(', ')} to the squad.`)
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
