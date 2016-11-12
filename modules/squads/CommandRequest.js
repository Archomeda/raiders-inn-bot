'use strict';

const
    config = require('config'),

    SquadGroup = require('./SquadGroup'),
    CommandSquadBase = require('./CommandSquadBase'),
    CommandError = require('../errors/CommandError');

class CommandRequest extends CommandSquadBase {
    constructor(module) {
        super(module);

        this.id = 'request';
        this.name = config.get('modules.squads.command_request');
        this.helpText = 'Requests a new squad channel for raiding. You can only request a new channel if you are not part of one already.';
        this.shortHelpText = 'Requests a new squad channel for raiding';
        this.listenChannels = config.get('modules.squads.channels');
    }

    onCommand(message, params) {
        const existingSquad = this.getSquadByMember(message.member);
        if (existingSquad) {
            const textChannel = message.guild.channels.get(existingSquad.textChannel);
            throw new CommandError(`You are part of a squad already! Please head over to ${textChannel}.`);
        }

        const squad = new SquadGroup();
        this.module.squads.push(squad);
        return squad.createChannels(message.guild)
            .then(() => this.reorderSquadChannels(message.guild, config.get('modules.squads.squads_after_textchannel'), config.get('modules.squads.squads_after_voicechannel')))
            .then(() => {
                return Promise.mapSeries(config.get('modules.squads.roles_with_permanent_access'), roleId => {
                    const role = message.guild.roles.get(roleId);
                    if (role) {
                        return Promise.all([
                            message.guild.channels.get(squad.textChannel).overwritePermissions(roleId, { READ_MESSAGES: true }),
                            message.guild.channels.get(squad.voiceChannel).overwritePermissions(roleId, { CONNECT: true })
                        ]);
                    }
                });
            })
            .then(() => squad.setLeader(message.member))
            .then(() => {
                setTimeout(() => this.onSquadExpired(message.guild, squad), config.get('modules.squads.disband_new_squad_after') * 60 * 1000);
                const textChannel = message.guild.channels.get(squad.textChannel);
                const voiceChannel = message.guild.channels.get(squad.voiceChannel);

                const invite = `${config.get('discord.command_prefix')}${config.get('modules.squads.command_invite')}`;
                const kick = `${config.get('discord.command_prefix')}${config.get('modules.squads.command_kick')}`;
                const transfer = `${config.get('discord.command_prefix')}${config.get('modules.squads.command_transfer')}`;
                const disband = `${config.get('discord.command_prefix')}${config.get('modules.squads.command_disband')}`;
                const leader = `${config.get('discord.command_prefix')}${config.get('modules.squads.command_leader')}`;
                const leave = `${config.get('discord.command_prefix')}${config.get('modules.squads.command_leave')}`;

                return textChannel.sendMessage(
                    `Welcome ${message.author} to your newly created squad **${squad.name}**.\n\n` +
                    ':white_medium_small_square: :white_medium_small_square: The rules are simple: :white_medium_small_square: :white_medium_small_square:\n\n' +
                    `The created text channel *${textChannel}* and voice channel *${voiceChannel.name}* are made specifically for your squad. ` +
                    'They are invisible and can only be accessed by the people you invite (except staff). ' +
                    'These channels are also **temporary**. ' +
                    `They will be removed once everyone leaves the voice channel or when you type \`${disband}\` manually. ` +
                    'This means that **every message will be lost once the channels are deleted**.\n\n' +
                    `You have **${config.get('modules.squads.disband_new_squad_after')} minutes** to join the respective voice channel *${voiceChannel.name}*. ` +
                    'If you have not joined the voice channel by then, this squad will be removed automatically by yours truly. ' +
                    'You can always create a new squad afterwards.\n\n' +
                    'Only the squad leader can manage the squad with the following commands:\n' +
                    `:small_blue_diamond: \`${invite}\` will invite one or more mentioned people (this only works in the same channel as where you created this squad).\n` +
                    `:small_blue_diamond: \`${kick}\` will kick one or more mentioned people.\n` +
                    `:small_blue_diamond: \`${transfer}\` will transfer squad leader status to the mentioned person.\n` +
                    `:small_blue_diamond: \`${disband}\` will disband this squad.\n\n` +
                    `Everyone else can do \`${leader}\` (which shows the current squad leader) and \`${leave}\` (which will cause you to leave the squad).\n\n` +
                    'Good luck and have fun! :beers:'
                );
            })
            .then(() => {
                const textChannel = message.guild.channels.get(squad.textChannel);
                return `Your squad channel ${textChannel} has been created. Good luck!`;
            });
    }
}

module.exports = CommandRequest;
