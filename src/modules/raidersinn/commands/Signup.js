'use strict';

const DiscordCommand = require('../../../../bot/modules/DiscordCommand');


class CommandSignup extends DiscordCommand {
    constructor(bot) {
        super(bot, 'signup', ['signup']);
        this._localizerNamespaces = 'module.raidersinn';

        this.removeMiddleware('replyWithMentions');
    }

    async onCommand(message) {
        const bot = this.getBot();
        const l = bot.getLocalizer();
        const ocnfig = this.getConfig();
        const client = bot.getClient();
        const channelId = ocnfig.get('signup-channel-id');
        const roles = ocnfig.get('roles');
        const channel = client.channels.resolve(channelId);

        if (message.channel.type !== 'text') {
            return l.t('module.raidersinn:signup.response-no-dm');
        }

        return l.t('module.raidersinn:signup.response', {
            channel,
            roles: roles.map(r => `${client.emojis.resolve(r.emoji) || r.emoji} ${r.name}`).join('\n')
        });
    }
}

module.exports = CommandSignup;
