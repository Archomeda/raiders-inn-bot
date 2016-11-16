'use strict';

const
    Command = require('../Command'),
    ReplyMethodMiddleware = require('../../middleware/ReplyMethodMiddleware');

class CommandExportIds extends Command {
    constructor(module) {
        super(module);

        this.helpText = 'Assembles all the available ids of this bot into a file.';

        this.middleware = new ReplyMethodMiddleware({ method: 'dm' });
    }

    onCommand(response) {
        const client = this.module.bot.getClient();
        let result = [];
        for (let server of client.guilds.array()) {
            result.push(`=== ${server.name}: ${server.id} ===`);
            result.push('Roles:');
            for (let role of server.roles.array().sort((a, b) => b.position - a.position)) {
                result.push(`${role.name}: ${role.id}`);
            }
            let textChannels = [];
            let voiceChannels = [];
            for (let channel of server.channels.array().sort((a, b) => a.position - b.position)) {
                if (channel.type === 'text') {
                    textChannels.push(`${channel.name}: ${channel.id}`);
                } else if (channel.type === 'voice') {
                    voiceChannels.push(`${channel.name}: ${channel.id}`);
                }
            }
            result.push('\nText channels:');
            result = result.concat(textChannels);
            result.push('\nVoice channels:');
            result = result.concat(voiceChannels);
            result.push('\nMembers:');
            for (let member of server.members.array()) {
                result.push(`${member.user.username}#${member.user.discriminator}: ${member.id}`);
            }
            result.push('\n');
        }
        response.message.author.sendFile(Buffer.from(result.join('\n')), 'ids.txt');
    }
}

module.exports = CommandExportIds;
