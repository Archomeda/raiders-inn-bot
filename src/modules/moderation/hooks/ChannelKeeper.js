'use strict';

const DiscordHook = require('../../../../bot/modules/DiscordHook');


class HookChannelKeeper extends DiscordHook {
    constructor(bot) {
        super(bot, 'channel-keeper');

        this._hooks = {
            voiceStateUpdate: this.onVoiceStateUpdate.bind(this)
        };
    }

    async keepChannels(origChannel) {
        const channelConfig = this.getConfig().get('channels');
        const channelRegexes = channelConfig.map(r => new RegExp(r.replace('\\d', '(\\d+)')));

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
                        channels[parseInt(match[1], 10) - 1] = channel;
                    }
                }
                break;
            }
        }

        // Clean up and/or add new channels
        let empty = channels.filter(c => c.members.size === 0).length;
        if (empty > 2) {
            for (let i = channels.length; i >= 0; i--) {
                if (channels[i] && channels[i].members.size === 0) {
                    try {
                        await channels[i].delete('This channel is currently unused'); // eslint-disable-line no-await-in-loop
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
        } else if (empty < 2) {
            const channelBase = channels.find(c => c);
            let pos = channelBase.position;
            for (let i = 0; i < channels.length + 2; i++) {
                if (!channels[i]) {
                    const name = channelConf.replace('\\d', i + 1);
                    let newChannel;
                    try {
                        newChannel = await channelBase.clone(name, true, true, 'New channel to keep up with demand'); // eslint-disable-line no-await-in-loop
                        this.log(`Created new channel ${name}`, 'log');
                    } catch (err) {
                        this.log(`Error while creating new channel ${name}: ${err}`, 'warn');
                    }
                    if (!newChannel) {
                        // Somehow cloning a voice channel causes Discord.js to fail because of an improper bitrate, but the channel is still cloned in Discord...
                        newChannel = channelBase.guild.channels.find('name', name);
                        if (newChannel) {
                            await newChannel.setPosition(pos); // eslint-disable-line no-await-in-loop
                            pos++;
                        }
                    }
                    empty++;
                } else {
                    pos = channels[i].position + 1;
                }
                if (empty >= 2) {
                    break;
                }
            }
        }
    }

    async onVoiceStateUpdate(oldMember, newMember) {
        const channels = this.getConfig().get('channels');

        if (channels.length === 0) {
            // No channels
            return;
        }

        const oldChannel = oldMember.voiceChannel;
        const newChannel = newMember.voiceChannel;

        try {
            if (oldChannel) {
                await this.keepChannels(oldChannel);
            }
            if (newChannel) {
                await this.keepChannels(newChannel);
            }
        } catch (err) {
            this.log(`Error while keeping channels: ${err}`, 'warn');
        }
    }
}

module.exports = HookChannelKeeper;
