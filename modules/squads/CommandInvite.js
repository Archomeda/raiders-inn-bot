'use strict';

const
    _ = require('lodash'),
    config = require('config'),
    Promise = require('bluebird'),
    i18next = Promise.promisifyAll(require('i18next')),

    CommandSquadBase = require('./CommandSquadBase'),
    CommandError = require('../../errors/CommandError'),
    MentionsOnlyMiddleware = require('../../middleware/MentionsOnlyMiddleware');

class CommandInvite extends CommandSquadBase {
    constructor(module) {
        super(module);
        i18next.loadNamespacesAsync('squads').then(() => {
            this.helpText = i18next.t('squads:invite.help');
            this.shortHelpText = i18next.t('squads:invite.short-help');
        });

        // Overwrite middleware
        this.middleware = new MentionsOnlyMiddleware();
    }

    onCommand(response) {
        const squad = this.getSquadByMember(response.message.member);
        if (!squad) {
            throw new CommandError(i18next.t('squads:invite.response-not-part-of-squad', {
                command_request: `${config.get('discord.command_prefix')}${this.module.config.commands.request.trigger}`
            }));
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
                            return textChannel.sendMessage(i18next.t('squads:invite.message-invited', {
                                leader: response.message.member.toString(),
                                members: invitableMembers.join(', ')
                            }));
                        })
                        .then(() => {
                            if (uninvitableMembers.length === 0) {
                                return i18next.t('squads:invite.response-invited', { members: invitableMembers.join(', ') });
                            } else {
                                return i18next.t('squads.invite.response-invited-and-already-part-of-squad', {
                                    members: invitableMembers.join(', '),
                                    failed_members: uninvitableMembers.join(', ')
                                });
                            }
                        });
                } else if (uninvitableMembers.length > 0) {
                    return i18next.t('squads.invite.response-already-part-of-squad', { members: uninvitableMembers.join(', ') });
                }
            });
    }
}

module.exports = CommandInvite;
