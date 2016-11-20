'use strict';

const
    config = require('config'),
    Promise = require('bluebird'),

    SquadGroup = require('./SquadGroup'),
    CommandSquadBase = require('./CommandSquadBase'),
    CommandError = require('../../errors/CommandError'),
    RestrictChannelsMiddleware = require('../../middleware/RestrictChannelsMiddleware');

class CommandRequest extends CommandSquadBase {
    constructor(module) {
        super(module);

        this.helpText = 'Requests a new squad channel for raiding. You can only request a new channel if you are not part of one already.';
        this.shortHelpText = 'Requests a new squad channel for raiding';

        // Overwrite middleware
        this.middleware = new RestrictChannelsMiddleware({ types: 'text' });
    }

    onCommand(response) {
        const existingSquad = this.getSquadByMember(response.message.member);
        if (existingSquad) {
            const textChannel = response.message.guild.channels.get(existingSquad.textChannel);
            throw new CommandError(`You are part of a squad already! Please head over to ${textChannel}.`);
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

                return textChannel.sendMessage(
                    `Welcome ${response.message.author} to your newly created squad **${squad.name}**.\n\n` +
                    ':white_medium_small_square: :white_medium_small_square: The rules are simple: :white_medium_small_square: :white_medium_small_square:\n\n' +
                    `The created text channel *${textChannel}* and voice channel *${voiceChannel.name}* are made specifically for your squad. ` +
                    'They are invisible and can only be accessed by the people you invite (except staff). ' +
                    'These channels are also **temporary**. ' +
                    `They will be removed once everyone leaves the voice channel or when you type \`${command(disband)}\` manually. ` +
                    'This means that **every message will be lost once the channels are deleted**.\n\n' +
                    `You have **${this.module.config.disband_new_squad_after} minutes** to join the respective voice channel *${voiceChannel.name}*. ` +
                    'If you have not joined the voice channel by then, this squad will be removed automatically by yours truly. ' +
                    'You can always create a new squad afterwards.\n\n' +
                    'Only the squad leader can manage the squad with the following commands:\n' +
                    `:small_blue_diamond: \`${command(invite)}\` will invite one or more mentioned people (this only works in the same channel as where you created this squad).\n` +
                    `:small_blue_diamond: \`${command(kick)}\` will kick one or more mentioned people.\n` +
                    `:small_blue_diamond: \`${command(transfer)}\` will transfer squad leader status to the mentioned person.\n` +
                    `:small_blue_diamond: \`${command(disband)}\` will disband this squad.\n\n` +
                    `Everyone else can do \`${command(leader)}\` (which shows the current squad leader) and \`${command(leave)}\` (which will cause you to leave the squad).\n\n` +
                    'Good luck and have fun! :beers:'
                );
            })
            .then(() => {
                const textChannel = response.message.guild.channels.get(squad.textChannel);
                return `Your squad channel ${textChannel} has been created. Good luck!`;
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
