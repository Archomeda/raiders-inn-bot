'use strict';

const
    _ = require('lodash'),
    config = require('config'),
    Promise = require('bluebird'),

    CommandError = require('./errors/CommandError'),
    SquadGroup = require('./squad/squad_group'),
    BaseModule = require('./base_module');

class SquadModule extends BaseModule {
    constructor(bot, config, filename) {
        super(bot, config, filename);
        this.name = 'Squads';

        this.squads = [];
        this.timeouts = {};

        this.onReady = this.onReady.bind(this);
        this.onVoiceStateUpdate = this.onVoiceStateUpdate.bind(this);

        const client = bot.getClient();
        client.on('ready', this.onReady);
        client.on('voiceStateUpdate', this.onVoiceStateUpdate);
    }

    onVoiceStateUpdate(oldMember, newMember) {
        try {
            const oldVoiceChannelId = oldMember.voiceChannelID;
            const newVoiceChannelId = newMember.voiceChannelID;
            if (oldVoiceChannelId === newVoiceChannelId) {
                // Nothing has changed for us
                return;
            }

            const oldVoiceChannel = oldMember.guild.channels.get(oldVoiceChannelId);
            const newVoiceChannel = newMember.guild.channels.get(newVoiceChannelId);
            const oldSquad = this.getSquadByChannel(oldVoiceChannel);
            const newSquad = this.getSquadByChannel(newVoiceChannel);
            if (!oldSquad && !newSquad) {
                // We have nothing do do here
                return;
            }

            if (oldSquad) {
                // We have a squad before
                if (!newSquad || oldSquad.voiceChannel !== newSquad.voiceChannel) {
                    // User has left the squad voice channel
                    const textChannel = oldMember.guild.channels.get(oldSquad.textChannel);
                    textChannel.sendMessage(`${oldMember} has left the voice channel.`);
                    if (oldVoiceChannel.members.size === 0) {
                        // No one is in the voice channel
                        const time = config.get('modules.squads.disband_empty_squad_after');
                        this.scheduleSquadExpire(oldMember.guild, oldSquad, time * 60 * 1000);
                        textChannel.sendMessage('Everyone has left the voice channel. ' +
                            `Disbanding squad in ${time} minutes if no one joins.`);
                    }
                }
            }
            if (newSquad) {
                // We have a squad after
                if (!oldSquad || oldSquad.voiceChannel !== newSquad.voiceChannel) {
                    // User has joined the squad voice channel
                    const textChannel = newMember.guild.channels.get(newSquad.textChannel);
                    textChannel.sendMessage(`${newMember} has joined the voice channel.`);
                }
            }
        } catch (err) {
            console.warn(`Unexpected error: ${err.message}`);
            console.warn(err.stack);
        }
    }

    onReady() {
        const client = this.bot.getClient();
        for (let guild of client.guilds.array()) {
            let restore = (guild => () => {
                if (!guild.available) {
                    // Delay for 5 seconds before checking again
                    console.log(`${guild.name} is not available yet, waiting for 5 seconds before attempting to restore squads`);
                    return setTimeout(() => restore(), 5000);
                }
                for (let channel of guild.channels.filterArray(channel => channel.type === 'voice')) {
                    try {
                        const squad = SquadGroup.fromChannel(channel);
                        if (squad) {
                            const textChannel = guild.channels.get(squad.textChannel);
                            const voiceChannel = guild.channels.get(squad.voiceChannel);
                            if (voiceChannel.members.size === 0) {
                                // No one is in the voice channel
                                this.scheduleSquadExpire(guild, squad, config.get('modules.squads.disband_restored_squad_after') * 60 * 1000);
                                textChannel.sendMessage("I'm very sorry that I was away for awhile, but I'm back! " +
                                    'It would seem that no one is in the voice channel, ' +
                                    `so I will clean up this squad in ${config.get('modules.squads.disband_restored_squad_after')} minutes if it stays that way.`);
                            } else {
                                textChannel.sendMessage("I'm very sorry that I was away for awhile, but I'm back!");
                            }
                            console.log(`Restored squad '${squad.name}'`);
                            this.squads.push(squad);
                        }
                    } catch (err) {
                        console.warn(`Unexpected error: ${err.message}`);
                        console.warn(err.stack);
                    }
                }
            })(guild);
            restore();
        }
    }

    scheduleSquadExpire(guild, squad, time) {
        if (this.timeouts[squad.voiceChannel]) {
            clearTimeout(this.timeouts[squad.voiceChannel]);
        }
        this.timeouts[squad.voiceChannel] = setTimeout(() => this.onSquadExpired(guild, squad), time);
    }

    onSquadExpired(guild, squad) {
        try {
            if (this.timeouts[squad.voiceChannel]) {
                delete this.timeouts[squad.voiceChannel];
            }

            const voiceChannel = guild.channels.get(squad.voiceChannel);
            if (voiceChannel && voiceChannel.members.size === 0) {
                // Double check if no one is connected
                squad.deleteChannels(guild)
                    .then(() => this.squads.splice(this.squads.indexOf(squad), 1))
                    .catch(err => {
                        console.warn(`Unexpected error: ${err.message}`);
                        console.warn(err.stack);
                    });
            }
        } catch (err) {
            console.warn(`Unexpected error: ${err.message}`);
            console.warn(err.stack);
        }
    }

    cmd_request() {
        return {
            id: 'request',
            command: config.get('modules.squads.command_request'),
            cooldown: 'user',
            help: 'Requests a new squad channel for raiding. You can only request a new channel if you are not part of one already.',
            short_help: 'Requests a new squad channel for raiding',
            channel_type: 'text',
            channels: config.get('modules.squads.channels'),
            on_command: message => {
                const existingSquad = this.getSquadByMember(message.member);
                if (existingSquad) {
                    const textChannel = message.guild.channels.get(existingSquad.textChannel);
                    throw new CommandError(`You are part of a squad already! Please head over to ${textChannel}.`);
                }

                const squad = new SquadGroup();
                this.squads.push(squad);
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
    }

    cmd_leader() {
        return {
            id: 'leader',
            command: config.get('modules.squads.command_leader'),
            cooldown: 'none',
            help: 'Gets the current leader of the squad. This only works in a squad channel.',
            short_help: 'Gets the current leader of the squad',
            channel_type: 'text',
            on_command: message => {
                const squad = this.checkSquadChannel(message.channel);
                if (!squad.leader) {
                    return 'This squad has currently no leader.';
                }
                return `This squad is led by ${message.guild.members.get(squad.leader)}.`;
            }
        }
    }

    cmd_invite() {
        return {
            id: 'invite',
            command: config.get('modules.squads.command_invite'),
            cooldown: 'none',
            help: 'Invites one or more mentioned users to the squad.',
            short_help: 'Invites one or more mentioned users to the squad',
            channel_type: 'text',
            channels: config.get('modules.squads.channels'),
            on_command: message => {
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
    }

    cmd_kick() {
        return {
            id: 'kick',
            command: config.get('modules.squads.command_kick'),
            cooldown: 'none',
            help: 'Kicks one or more mentioned users from the squad. This only works in a squad channel.',
            short_help: 'Kicks one or more mentioned users from the squad',
            channel_type: 'text',
            on_command: message => {
                const squad = this.checkSquadChannel(message.channel);
                this.checkLeader(squad, message.member);
                const mentions = this.filterMentionsInside(squad, message.member, message.mentions.users.array());
                if (mentions.length === 0) {
                    throw new CommandError(`This command will only work if you mention one or more people, like ${message.author}.`);
                }
                return Promise.mapSeries(mentions, user => message.guild.fetchMember(user))
                    .then(members => {
                        return squad.removeMembers(members).then(() => {
                            const textChannel = message.guild.channels.get(squad.textChannel);
                            textChannel.sendMessage(`${message.member} has kicked ${members.join(', ')}.`);
                        });
                    });
            }
        }
    }

    cmd_transfer() {
        return {
            id: 'transfer',
            command: config.get('modules.squads.command_transfer'),
            cooldown: 'none',
            help: 'Transfers squad leader status to the mentioned user. This only works in a squad channel.',
            short_help: 'Transfers squad leader status to the mentioned user',
            channel_type: 'text',
            on_command: message => {
                const squad = this.checkSquadChannel(message.channel);
                this.checkLeader(squad, message.member);
                const mentions = this.filterMentionsInside(squad, message.member, message.mentions.users.array());
                if (mentions.length === 0) {
                    throw new CommandError(`This command will only work if you mention a person, like ${message.author}.`);
                }
                return message.guild.fetchMember(mentions[0]).then(member => {
                    return squad.setLeader(member).then(() => `The squad leader is now ${member}.`);
                });
            }
        }
    }

    cmd_leave() {
        return {
            id: 'leave',
            command: config.get('modules.squads.command_leave'),
            cooldown: 'none',
            help: 'Leaves the current squad you are in. This only works in a squad channel.',
            short_help: 'Leaves your current squad',
            channel_type: 'text',
            on_command: message => {
                const squad = this.checkSquadChannel(message.channel);
                if (squad.leader === message.member.id) {
                    throw new CommandError(
                        "You can't leave the squad because you're the squad leader. " +
                        'You have to either transfer your squad leader status with `!transfer` or disband the squad entirely with `!disband`.'
                    );
                }
                const textChannel = message.guild.channels.get(squad.textChannel);
                return textChannel.sendMessage(`${message.member} has left the squad.`).then(() => squad.removeMember(message.member));
            }
        }
    }

    cmd_disband() {
        return {
            id: 'disband',
            command: config.get('modules.squads.command_disband'),
            cooldown: 'none',
            help: 'Disbands the current squad you are the leader of. This only works in a squad channel.',
            short_help: 'Disbands your squad',
            channel_type: 'text',
            on_command: message => {
                const squad = this.checkSquadChannel(message.channel);
                this.checkLeader(squad, message.member);
                return squad.deleteChannels(message.guild).then(() => {
                    this.squads.splice(this.squads.indexOf(squad), 1);
                    return null;
                });
            }
        }
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

    getSquadByMember(member) {
        return this.squads.find(s => s.members.indexOf(member.id) > -1);
    }

    getSquadByChannel(channel) {
        if (!channel) {
            return null;
        }
        switch (channel.type) {
            case 'text':
                return this.squads.find(s => s.textChannel === channel.id);
            case 'voice':
                return this.squads.find(s => s.voiceChannel === channel.id);
        }
        return null;
    }

    checkSquadChannel(channel) {
        const squad = this.getSquadByChannel(channel);
        if (!squad) {
            throw new CommandError('You can only execute this command in a squad channel.');
        }
        return squad;
    }

    checkLeader(squad, member) {
        if (squad.leader !== member.id) {
            throw new CommandError('Only squad leaders can execute this command.');
        }
        return member;
    }

    filterMentionsOutside(squad, member, mentions) {
        const client = this.bot.getClient();
        return mentions.filter(m => squad.members.indexOf(m.id) === -1 && member.id !== m.id && client.user.id !== m.id);
    }

    filterMentionsInside(squad, member, mentions) {
        const client = this.bot.getClient();
        return mentions.filter(m => squad.members.indexOf(m.id) > -1 && member.id !== m.id && client.user.id !== m.id);
    }
}

module.exports = SquadModule;
