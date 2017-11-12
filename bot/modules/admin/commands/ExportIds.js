'use strict';

const DiscordReplyMessage = require('../../DiscordReplyMessage');

const AutoRemoveMessage = require('../../../middleware/AutoRemoveMessage');

const DiscordCommand = require('../../../modules/DiscordCommand');


class CommandExportIds extends DiscordCommand {
    constructor(bot) {
        super(bot, 'export-ids', ['exportids']);
        this._localizerNamespaces = 'module.admin';

        this.setMiddleware(new AutoRemoveMessage(bot, this, { defaultRequest: 60, defaultResponse: 60 })); // Auto remove messages after 1 minute
    }

    async onCommand(message) {
        const bot = this.getBot();
        const client = bot.getClient();
        const l = bot.getLocalizer();

        let result = [];
        for (const guild of client.guilds.array()) {
            result.push(`=== ${guild.name}: ${guild.id} ===`);

            result.push(l.t('module.admin:export-ids.export-roles'));
            for (const role of guild.roles.array().sort((a, b) => b.position - a.position)) {
                result.push(`${role.name}: ${role.id}`);
            }

            result.push(`\n${l.t('module.admin:export-ids.export-emojis')}`);
            for (const emoji of guild.emojis.array().sort((a, b) => a.createdTimestamp - b.createdTimestamp)) {
                result.push(`${emoji.name}: ${emoji.id}`);
            }

            result.push(`\n${l.t('module.admin:export-ids.export-channels')}`);
            const categories = guild.channels.filterArray(c => c.type === 'category').sort((a, b) => a.position - b.position);
            const channelsWithoutCategory = guild.channels.filterArray(c => c.type !== 'category' && !c.parent).sort((a, b) => a.type === b.type ? a.position - b.position : a.type.localeCompare(b.type));
            const printChannel = c => result.push(`${c.name} (${c.type}): ${c.id}`);
            for (const channel of channelsWithoutCategory) {
                printChannel(channel);
            }
            for (const category of categories) {
                result.push(`> ${category.name} (${category.id}) <`);
                for (const channel of category.children.array().sort((a, b) => a.type === b.type ? a.position - b.position : a.type.localeCompare(b.type))) {
                    printChannel(channel);
                }
            }

            result.push(`\n${l.t('module.admin:export-ids.export-members')}`);
            for (const member of guild.members.array()) {
                result.push(`${member.user.tag}${member.nickname ? ` (${member.nickname})` : ''}: ${member.id}`);
            }
            result.push('\n');
        }

        if (message.channel.type !== 'dm') {
            // Send the file by DM instead
            await message.author.send('', { files: [{ attachment: Buffer.from(result.join('\n')), name: 'ids.txt' }] });
            return l.t('module.admin:export-ids.response-see-dm');
        }

        return new DiscordReplyMessage('', { files: [{ attachment: Buffer.from(result.join('\n')), name: 'ids.txt' }] });
    }
}

module.exports = CommandExportIds;
