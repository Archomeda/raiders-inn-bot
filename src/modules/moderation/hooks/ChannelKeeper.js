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

    async keepChannelsOfGroup(guild, groupConf) {
        const groupRegex = new RegExp(`^${groupConf.replace('\\d', '(\\d+)')}$`);

        // Find all related channels
        const groupChannels = guild.channels.filterArray(c => c.type === 'voice' && groupRegex.test(c.name));
        const channels = [];
        for (const channel of groupChannels) {
            const match = channel.name.match(groupRegex);
            const index = parseInt(match[1], 10) - 1;
            if (index >= 0) {
                channels[index] = channel;
            }
        }

        let empty = groupChannels.filter(c => c.members.size === 0).length;
        if (empty > 2) {
            // Delete some empty channels until we have 2 left
            const exec = [];
            for (let i = channels.length; i >= 0; i--) {
                if (!channels[i]) {
                    continue;
                }
                if (channels[i].members.size === 0) {
                    try {
                        exec.push(channels[i].delete('Unused channel'));
                        this.log(`Removed unused channel ${channels[i].name}`, 'log');
                    } catch (err) {
                        this.log(`Error while removing unused channel ${channels[i].name}: ${err}`, 'warn');
                    }
                    empty--;
                }
                if (empty <= 2) {
                    break;
                }
            }
            await Promise.all(exec);
        } else if (empty < 2) {
            // Add some new channels
            const channelBase = groupChannels[0];
            if (!channelBase) {
                this.log('Error while creating new channels: No base channel can be found', 'warn');
                return;
            }
            const parentChannel = channelBase.parent;
            const numberOfChannelsToAdd = 2 - empty;

            // 1. Predetermine the channel order
            const toOrder = [];
            const groupSiblingChannels = parentChannel ? parentChannel.children.array() : guild.channels.filterArray(c => !c.parent);
            const siblingChannels = [];
            for (const channel of groupSiblingChannels) {
                siblingChannels[channel.position] = channel;
            }
            const startPos = groupSiblingChannels.find(c => c.id === channels.find(c => c).id).position;
            let endPos = startPos;
            for (let i = 0; i < channels.length; i++) {
                if (channels[i]) {
                    toOrder.push({ channel: channels[i].id, position: startPos + i });
                    endPos = startPos + i;
                }
            }
            endPos += 1 + numberOfChannelsToAdd;
            for (let i = 0; i < siblingChannels.length; i++) {
                if (i < startPos) {
                    toOrder.push({ channel: siblingChannels[i].id, position: i });
                } else if (siblingChannels[i] && !channels.some(c => c.id === siblingChannels[i].id)) {
                    toOrder.push({ channel: siblingChannels[i].id, position: endPos });
                    endPos++;
                }
            }

            // 2. Create the channels
            for (let i = 0; i < channels.length + 2; i++) {
                if (!channels[i]) {
                    // Found a spot
                    const name = groupConf.replace('\\d', i + 1);
                    let newChannel;
                    try {
                        newChannel = await channelBase.clone({ name, reason: 'New channel to keep up with demand' }); // eslint-disable-line no-await-in-loop
                        await newChannel.edit({ // eslint-disable-line no-await-in-loop
                            parentID: channelBase.parentID,
                            userLimit: channelBase.userLimit // Somehow this doesn't get cloned or something...
                        });
                        toOrder.push({ channel: newChannel.id, position: startPos + i });
                        this.log(`Created new channel ${name} at position ${startPos + i}`, 'log');
                    } catch (err) {
                        this.log(`Error while creating new channel ${name}: ${err}`, 'warn');
                    }
                    empty++;
                }
                if (empty >= 2) {
                    break;
                }
            }

            // 3. Properly order the channels
            await guild.setChannelPositions(toOrder);
        }
    }

    async keepChannels(guild) {
        const channelConfig = this.getConfig().get('channels');
        for (const conf of channelConfig) {
            await this.keepChannelsOfGroup(guild, conf); // eslint-disable-line no-await-in-loop
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
        const guild = oldChannel ? oldChannel.guild : newChannel ? newChannel.guild : undefined;
        if (guild) {
            this._timeout = setTimeout(async () => {
                try {
                    await this.keepChannels(guild);
                } catch (err) {
                    this.log(`Error while keeping channels: ${err}`, 'warn');
                }
                this._timeout = undefined;
            }, waitTime);
        }
    }
}

module.exports = HookChannelKeeper;
