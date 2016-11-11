'use strict';

const
    config = require('config'),
    random = require('random-js')(),
    Promise = require('bluebird');

const existingNames = [];
const adjectives = config.get('modules.squads.squad_names.adjectives');
const nouns = config.get('modules.squads.squad_names.nouns');
const textChannelTemplate = config.get('modules.squads.textchannel_template');
const voiceChannelTemplate = config.get('modules.squads.voicechannel_template');

class SquadGroup {
    constructor() {
        this._name = null;
        this._leader = null;
        this._members = [];
        this._state = 'closed';
        this._textChannel = null;
        this._voiceChannel = null;
    }

    static fromChannel(channel) {
        if (channel.type !== 'voice') {
            throw new TypeError('channel is not a voice channel');
        }

        const isSquadChannel = this.isSquadChannel(channel);
        if (isSquadChannel.type !== 'voice') {
            // Channel doesn't match
            return null;
        }

        const squad = new SquadGroup();
        squad._name = isSquadChannel.name;
        squad._voiceChannel = channel.id;
        const textChannel = channel.guild.channels.find('name', textChannelTemplate.replace('{name}', this.makeTextChannelName(squad._name)));
        squad._textChannel = textChannel ? textChannel.id : null;
        squad._members = channel.permissionOverwrites.filter(overwrite => overwrite.type === 'member').map(u => u.id);
        squad._leader = squad._members.find(member => {
            const permissions = channel.permissionsFor(member);
            return permissions && permissions.hasPermission('SEND_MESSAGES', true);
        });

        if (!squad._voiceChannel || !squad._textChannel) {
            // We are lacking one of the channels
            // TODO: clean those up
            return null;
        }

        existingNames.push(squad._name);

        return squad;
    }

    static isSquadChannel(channel) {
        const textChannelRegex = new RegExp(`^${textChannelTemplate.replace('{name}', '(.*)')}$`);
        const voiceChannelRegex = new RegExp(`^${voiceChannelTemplate.replace('{name}', '(.*)')}$`);
        let match;
        if (match = channel.name.match(textChannelRegex)) {
            return { type: 'text', name: match[1] };
        } else if (match = channel.name.match(voiceChannelRegex)) {
            return { type: 'voice', name: match[1] };
        }
        return { type: false };
    }

    static generateUniqueName() {
        let name = '';
        let success = false;
        let i = 0;

        // Try generating a name 10 times, if we don't have a unique name after that, give up and generate a numbered room
        do {
            const adjective = adjectives[random.integer(0, adjectives.length - 1)];
            const noun = nouns[random.integer(0, nouns.length - 1)];
            name = this.makeVoiceChannelName(`${adjective} ${noun}`);
            success = existingNames.indexOf(name) === -1;
            i++;
        } while (i < 10 && !success);

        if (!success) {
            i = existingNames.length + 1;
            do {
                name = `Squad ${i}`;
                success = existingNames.indexOf(name) === -1;
            } while (!success)
        }

        return name;
    }

    static makeTextChannelName(name) {
        return name.toLowerCase().replace(/\s/g, '-').replace(/'/g, '');
    }

    static makeVoiceChannelName(name) {
        return name.replace(/\w\S*/g, w => `${w.charAt(0).toUpperCase()}${w.substr(1).toLowerCase()}`);
    }

    createChannels(guild) {
        this._name = this.constructor.generateUniqueName();
        existingNames.push(this._name);
        const textChannelName = this.constructor.makeTextChannelName(textChannelTemplate.replace('{name}', this._name));
        const voiceChannelName = voiceChannelTemplate.replace('{name}', this._name);

        return Promise.all([
            guild.createChannel(textChannelName, 'text')
                .then(channel => {
                    return Promise.resolve(channel.overwritePermissions(guild.id, { READ_MESSAGES: false }))
                        .return(channel);
                }),
            guild.createChannel(voiceChannelName, 'voice')
                .then(channel => {
                    return Promise.resolve(channel.overwritePermissions(guild.id, { CONNECT: false }))
                        .return(channel);
                })
        ]).spread((textChannel, voiceChannel) => {
            this._textChannel = textChannel.id;
            this._voiceChannel = voiceChannel.id;
        }).catch(err => {
            existingNames.splice(existingNames.indexOf(this._name), 1);
            throw err;
        });
    }

    deleteChannels(guild) {
        const promises = [];
        if (this._textChannel) {
            promises.push(guild.channels.get(this._textChannel).delete());
        }
        if (this._voiceChannel) {
            promises.push(guild.channels.get(this._voiceChannel).delete());
        }
        return Promise.all(promises).then(() => {
            const index = existingNames.indexOf(this._name);
            if (index > -1) {
                existingNames.splice(index, 1);
            }
        });
    }

    setPermissions(member, permissions) {
        const textChannel = member.guild.channels.get(this._textChannel);
        const voiceChannel = member.guild.channels.get(this._voiceChannel);

        if (!permissions) {
            const textPerm = textChannel.permissionOverwrites.get(member);
            const voicePerm = voiceChannel.permissionOverwrites.get(member);
            const promises = [];
            if (textPerm) {
                promises.push(textPerm.delete());
            }
            if (voicePerm) {
                promises.push(voicePerm.delete());
            }
            return Promise.all(promises).then(() => {

            });
        } else {
            return Promise.all([
                textChannel.overwritePermissions(member, permissions),
                voiceChannel.overwritePermissions(member, permissions)
            ]);
        }
    }

    get name() {
        return this._name;
    }

    get leader() {
        return this._leader;
    }

    setLeader(member) {
        if (!member.user) {
            throw new TypeError('member does not have a user associated');
        }

        const oldLeader = member.guild.members.get(this._leader);
        this._leader = member.id;
        if (oldLeader) {
            // Demote or remove previous leader
            let newPermissions = null;
            if (this._members.indexOf(oldLeader.id) > -1) {
                newPermissions = { READ_MESSAGES: true, CONNECT: true };
            }
            return this.setPermissions(oldLeader, newPermissions).then(() => {
                return this.setPermissions(member, { READ_MESSAGES: true, MANAGE_MESSAGES: true, CONNECT: true });
            });
        } else {
            if (this._members.indexOf(this._leader) === -1) {
                this._members.push(this._leader);
            }
            // SEND_MESSAGES is used to indicate who is the leader, a harmless permission since it's implied
            return this.setPermissions(member, { READ_MESSAGES: true, SEND_MESSAGES: true, CONNECT: true });
        }
    }

    get members() {
        return this._members;
    }

    addMember(member) {
        if (!member.user) {
            throw new TypeError('member does not have a user associated');
        }
        if (this._members.indexOf(member.id) === -1) {
            this._members.push(member.id);
            return this.setPermissions(member, { READ_MESSAGES: true, CONNECT: true });
        }
    }

    addMembers(members) {
        if (!Array.isArray(members)) {
            throw new TypeError('members is not an array');
        }
        return Promise.mapSeries(members, member => this.addMember(member));
    }

    removeMember(member) {
        let memberId = member;
        if (member.id) {
            memberId = member.id;
        }
        const index = this._members.indexOf(memberId);
        if (index > -1) {
            this._members.splice(index, 1);
            return this.setPermissions(member);
        }
    }

    removeMembers(members) {
        if (!Array.isArray(members)) {
            throw new TypeError('mebmers is not an array');
        }
        return Promise.mapSeries(members, member => this.removeMember(member));
    }

    get state() {
        return this._state;
    }

    set state(state) {
        if (!new Set(['open', 'closed', 'inviteonly']).has(state)) {
            throw new RangeError('state should be open, closed or inviteonly');
        }
        this._state = state;
    }

    get textChannel() {
        return this._textChannel;
    }

    get voiceChannel() {
        return this._voiceChannel;
    }
}

module.exports = SquadGroup;
