'use strict';

const
    i18next = require('i18next'),

    SquadGroup = require('./SquadGroup'),
    Module = require('../Module'),
    CommandRequest = require('./CommandRequest'),
    CommandLeader = require('./CommandLeader'),
    CommandInvite = require('./CommandInvite'),
    CommandKick = require('./CommandKick'),
    CommandTransfer = require('./CommandTransfer'),
    CommandLeave = require('./CommandLeave'),
    CommandDisband = require('./CommandDisband');

class ModuleSquads extends Module {
    constructor(bot, moduleConfig) {
        super(bot, moduleConfig);

        this.registerCommand(new CommandRequest(this));
        this.registerCommand(new CommandLeader(this));
        this.registerCommand(new CommandInvite(this));
        this.registerCommand(new CommandKick(this));
        this.registerCommand(new CommandTransfer(this));
        this.registerCommand(new CommandLeave(this));
        this.registerCommand(new CommandDisband(this));

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
                    textChannel.sendMessage(i18next.t('squads:squad-base.message-left-voice-channel', { member: oldMember.toString() }));
                    if (oldVoiceChannel.members.size === 0) {
                        // No one is in the voice channel
                        const time = this.config.disband_empty_squad_after;
                        this.scheduleSquadExpire(oldMember.guild, oldSquad, time * 60 * 1000);
                        textChannel.sendMessage(i18next.t('squads:squad-base.message-empty-voice-channel', { expire: time }));
                    }
                }
            }
            if (newSquad) {
                // We have a squad after
                if (!oldSquad || oldSquad.voiceChannel !== newSquad.voiceChannel) {
                    // User has joined the squad voice channel
                    const textChannel = newMember.guild.channels.get(newSquad.textChannel);
                    textChannel.sendMessage(i18next.t('squads:squad-base.message-joined-voice-channel', { member: newMember.toString() }));
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
                                this.scheduleSquadExpire(guild, squad, this.config.disband_restored_squad_after * 60 * 1000);
                                textChannel.sendMessage(i18next.t('squads:squad-base.message-restored-cleanup', { expire: this.config.disband_restored_squad_after }));
                            } else {
                                textChannel.sendMessage(i18next.t('squads:squad-base.message-restored'));
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
