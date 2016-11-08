'use strict';

const
    config = require('config'),
    BaseModule = require('./base_module');

class ManageModule extends BaseModule {
    constructor(bot, config, filename) {
        super(bot, config, filename);
        this.name = 'Manage';
    }

    cmd_listIds() {
        return {
            id: 'listids',
            command: config.get('modules.manage.command_listids'),
            deliver: 'dm',
            cooldown: 'user',
            help: 'Assembles all the available ids of this bot into a file.',
            on_command: message => {
                const client = this.bot.getClient();
                let result = [];
                for (let server of client.guilds.array()) {
                    result.push(`=== ${server.name} ===`);
                    result.push('Roles:');
                    for (let role of server.roles.array()) {
                        result.push(`${role.name}: ${role.id}`);
                    }
                    result.push('\nChannels:');
                    for (let channel of server.channels.array()) {
                        result.push(`${channel.name} (${channel.type}): ${channel.id}`);
                    }
                    result.push('\nMembers:');
                    for (let member of server.members.array()) {
                        result.push(`${member.user.username}#${member.user.discriminator}: ${member.id}`);
                    }
                    result.push('\n');
                }
                message.author.sendFile(Buffer.from(result.join('\n')), 'ids.txt');
            }
        }
    }
}

module.exports = ManageModule;
