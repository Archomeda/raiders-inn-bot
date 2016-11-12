'use strict';

const
    config = require('config'),

    SquadGroup = require('./squad-group'),
    ModuleBase = require('../module-base'),
    CommandRequest = require('./command-request'),
    CommandLeader = require('./command-leader'),
    CommandInvite = require('./command-invite'),
    CommandKick = require('./command-kick'),
    CommandTransfer = require('./command-transfer'),
    CommandLeave = require('./command-leave'),
    CommandDisband = require('./command-disband');

class ModuleSquads extends ModuleBase {
    constructor(bot) {
        super(bot);

        this._commands = [
            new CommandRequest(this),
            new CommandLeader(this),
            new CommandInvite(this),
            new CommandKick(this),
            new CommandTransfer(this),
            new CommandLeave(this),
            new CommandDisband(this)
        ];

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
}

module.exports = ModuleSquads;
