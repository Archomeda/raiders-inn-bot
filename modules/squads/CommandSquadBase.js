'use strict';

const
    SquadGroup = require('./SquadGroup'),
    Command = require('../Command'),
    CommandError = require('../../errors/CommandError');

class CommandSquadBase extends Command {
    constructor(module) {
        super(module);

        this.cooldownType = 'none';
        this.listenChannelTypes = 'text';
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
        return this.module.squads.find(s => s.members.includes(member.id));
    }

    getSquadByChannel(channel) {
        return this.module.getSquadByChannel(channel);
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
        const client = this.module.bot.getClient();
        return mentions.filter(m => !squad.members.includes(m.id) && member.id !== m.id/* && client.user.id !== m.id*/);
    }

    filterMentionsInside(squad, member, mentions) {
        const client = this.module.bot.getClient();
        return mentions.filter(m => squad.members.includes(m.id) && member.id !== m.id/* && client.user.id !== m.id*/);
    }
}

module.exports = CommandSquadBase;
