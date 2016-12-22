'use strict';

const
    config = require('config'),
    Promise = require('bluebird'),
    i18next = Promise.promisifyAll(require('i18next')),

    SquadGroup = require('./SquadGroup'),
    CommandSquadBase = require('./CommandSquadBase'),
    CommandError = require('../../errors/CommandError'),
    RestrictChannelsMiddleware = require('../../middleware/RestrictChannelsMiddleware');

class CommandRequest extends CommandSquadBase {
    constructor(module) {
        super(module);
        i18next.loadNamespacesAsync('squads').then(() => {
            this.helpText = i18next.t('squads:request.help');
            this.shortHelpText = i18next.t('squads:request.short-help');
        });

        // Overwrite middleware
        this.middleware = new RestrictChannelsMiddleware({ types: 'text' });
    }

    onCommand(response) {
        const existingSquad = this.getSquadByMember(response.message.member);
        if (existingSquad) {
            const textChannel = response.message.guild.channels.get(existingSquad.textChannel);
            throw new CommandError(i18next.t('squads:request.response-already-part-of-squad', { channel: textChannel.toString() }));
        }

        const squad = new SquadGroup();
        this.module.squads.push(squad);
        return squad.createChannels(response.message.guild)
            .then(() => this.reorderSquadChannels(response.message.guild, this.module.config.squads_after_textchannel, this.module.config.squads_after_voicechannel))
            .then(() => {
                return Promise.mapSeries(this.module.config.roles_with_permanent_access, roleId => {
                    const role = response.message.guild.roles.get(roleId);
                    if (role) {
                        return Promise.all([
                            response.message.guild.channels.get(squad.textChannel).overwritePermissions(roleId, { READ_MESSAGES: true }),
                            response.message.guild.channels.get(squad.voiceChannel).overwritePermissions(roleId, { CONNECT: true })
                        ]);
                    }
                });
            })
            .then(() => squad.setLeader(response.message.member))
            .then(() => {
                setTimeout(() => this.module.onSquadExpired(response.message.guild, squad), this.module.config.disband_new_squad_after * 60 * 1000);
                const textChannel = response.message.guild.channels.get(squad.textChannel);
                const voiceChannel = response.message.guild.channels.get(squad.voiceChannel);

                const invite = this.module.config.commands.invite.trigger;
                const kick = this.module.config.commands.kick.trigger;
                const transfer = this.module.config.commands.transfer.trigger;
                const disband = this.module.config.commands.disband.trigger;
                const leader = this.module.config.commands.leader.trigger;
                const leave = this.module.config.commands.leave.trigger;
                const command = c => `${config.get('discord.command_prefix')}${c}`;

                return textChannel.sendMessage(i18next.t('squads:request.message-rules', {
                    leader: response.message.author.toString(),
                    name: squad.name,
                    text_channel: textChannel.toString(),
                    voice_channel: voiceChannel.name,
                    channel_expire: this.module.config.disband_new_squad_after,
                    command_disband: command(disband),
                    command_invite: command(invite),
                    command_kick: command(kick),
                    command_transfer: command(transfer),
                    command_leader: command(leader),
                    command_leave: command(leave)
                }));
            })
            .then(() => {
                const textChannel = response.message.guild.channels.get(squad.textChannel);
                return i18next.t('squads:request.response', { channel: textChannel.toString() });
            });
    }

    reorderSquadChannels(guild, afterTextChannel, afterVoiceChannel) {
        const sortChannels = (afterChannel, type) => {
            afterChannel = guild.channels.get(afterChannel);
            const channels = guild.channels.filterArray(c => c.type === type && !SquadGroup.isSquadChannel(c).type);
            channels.sort((a, b) => a.position - b.position);
            const squadChannels = guild.channels.filterArray(c => SquadGroup.isSquadChannel(c).type === type);
            squadChannels.sort((a, b) => {
                const la = a.name.toLowerCase();
                const lb = b.name.toLowerCase();
                if (la < lb) return -1;
                if (la > lb) return 1;
                return 0;
            });
            const beforeChannelIndex = channels.findIndex(c => c.id === afterChannel.id) + 1;

            // Set the channels that are positioned after the squad channels on a position that's higher than our squad channel positions
            return Promise.each(channels.slice(beforeChannelIndex), (c, i) => {
                return c.setPosition(afterChannel.position + squadChannels.length + i + 1);
            }).then(() => {
                // Set the squad channels in the correct order
                return Promise.each(squadChannels, (c, i) => {
                    return c.setPosition(afterChannel.position + i + 1);
                })
            });
        };

        return Promise.all([
            sortChannels(afterTextChannel, 'text'),
            sortChannels(afterVoiceChannel, 'voice')
        ]);
    }
}

module.exports = CommandRequest;
