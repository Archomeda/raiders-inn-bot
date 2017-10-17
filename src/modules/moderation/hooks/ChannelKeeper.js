'use strict';

const DiscordHook = require('../../../../bot/modules/DiscordHook');


const waitTime = 5 * 1000;


class HookChannelKeeper extends DiscordHook {
    constructor(bot) {
        super(bot, 'channel-keeper');

        this._timeout = undefined;

        this._hooks = {
            voiceStateUpdate: this.onVoiceStateUpdate.bind(this)
        };
    }

    async keepChannels(origChannel) {
        const channelConfig = this.getConfig().get('channels');
        const channelRegexes = channelConfig.map(r => new RegExp(`^${r.replace('\\d', '(\\d+)')}$`));

        // Find all related channels
        const channels = [];
        let channelRegex;
        let channelConf;
        for (let i = 0; i < channelConfig.length; i++) {
            channelRegex = channelRegexes[i];
            channelConf = channelConfig[i];
            const match = origChannel.name.match(channelRegex);
            if (match) {
                for (const channel of origChannel.guild.channels.filterArray(c => c.type === 'voice')) {
                    const match = channel.name.match(channelRegex);
                    if (match) {
                        channels.push({ channel, index: parseInt(match[1], 10) - 1 });
                    }
                }
                break;
            } else if (channelConfig.length === i + 1) {
                // No match
                return;
            }
        }
        channels.sort((a, b) => a.index - b.index);

        let empty = channels.filter(c => c.channel.members.size === 0).length;
        if (empty > 2) {
            // Delete some empty channels, starting with the last one
            for (let i = channels.length; i >= 0; i--) {
                if (channels[i] && channels[i].channel.members.size === 0) {
                    try {
                        await channels[i].channel.delete('This channel is currently unused'); // eslint-disable-line no-await-in-loop
                        this.log(`Removed unused channel ${channels[i].channel.name}`, 'log');
                    } catch (err) {
                        this.log(`Error while removing unused channel ${channels[i].channel.name}: ${err}`, 'warn');
                    }
                    empty--;
                }
                if (empty <= 2) {
                    break;
                }
            }
        } else if (empty < 2) {
            // Add some new channels
            const channelBase = channels.find(c => c).channel;
            const parentChannel = channelBase.parent;
            const siblingChannels = parentChannel ? parentChannel.children.array() : channelBase.guild.channels.filterArray(c => !c.parent);
            siblingChannels.sort((a, b) => a.position - b.position);
            const numberOfChannelsToAdd = 2 - empty;

            // 1) Change the positions of the channels allowing us to insert the new ones without position problems
            const toOrder = [];
            const startPos = siblingChannels.find(c => c.id === channels[0].channel.id).position;
            for (const { channel, index } of channels) {
                if (channel.position !== startPos + index) {
                    toOrder.push({ channel: channel.id, position: startPos + index });
                }
            }
            const siblingChannelsAfter = siblingChannels.filter(sc => sc.position >= startPos && !channels.find(c => c.channel.id === sc.id));
            for (let i = 0; i < siblingChannelsAfter.length; i++) {
                const channel = siblingChannelsAfter[i];
                const pos = startPos + channels.length + i + numberOfChannelsToAdd;
                if (channel.position !== pos) {
                    toOrder.push({ channel: channel.id, position: pos });
                }
            }
            await channelBase.guild.setChannelPositions(toOrder);

            // 2) Add the new channels
            for (let i = 0; i < channels.length + 2; i++) {
                if (!channels.find(c => c.index === i)) {
                    // Found a spot
                    const name = channelConf.replace('\\d', i + 1);
                    let newChannel;
                    try {
                        newChannel = await channelBase.clone({ name, reason: 'New channel to keep up with demand' }); // eslint-disable-line no-await-in-loop
                        const editData = {
                            position: startPos + i,
                            userLimit: channelBase.userLimit
                        };
                        if (channelBase.parent) {
                            editData.parentID = channelBase.parentID;
                        }
                        await newChannel.edit(editData); // eslint-disable-line no-await-in-loop
                        this.log(`Created new channel ${name} at position ${editData.position}`, 'log');
                    } catch (err) {
                        this.log(`Error while creating new channel ${name}: ${err}`, 'warn');
                    }
                    empty++;
                }
                if (empty >= 2) {
                    break;
                }
            }
        }
    }

    async onVoiceStateUpdate(oldMember, newMember) {
        if (this._timeout) {
            return;
        }

        const channels = this.getConfig().get('channels');

        if (channels.length === 0) {
            // No channels
            return;
        }

        const oldChannel = oldMember.voiceChannel;
        const newChannel = newMember.voiceChannel;

        if (newChannel) {
            this._timeout = setTimeout(async () => {
                try {
                    await this.keepChannels(newChannel);
                } catch (err) {
                    this.log(`Error while keeping channels: ${err}`, 'warn');
                }
                this._timeout = undefined;
            }, waitTime);
        } else if (oldChannel) {
            this._timeout = setTimeout(async () => {
                try {
                    await this.keepChannels(oldChannel);
                } catch (err) {
                    this.log(`Error while keeping channels: ${err}`, 'warn');
                }
                this._timeout = undefined;
            }, waitTime);
        }
    }
}

module.exports = HookChannelKeeper;
