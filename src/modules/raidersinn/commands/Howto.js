'use strict';

const DiscordCommand = require('../../../../bot/modules/DiscordCommand');


class CommandHowto extends DiscordCommand {
    constructor(bot) {
        super(bot, 'howto', ['howto']);
        this._localizerNamespaces = 'module.raidersinn';

        this.removeMiddleware('replyWithMentions');
    }

    async onCommand(message) {
        const bot = this.getBot();
        const l = bot.getLocalizer();
        const channelId = this.getConfig().get('welcome-channel-id');
        const channel = bot.getClient().channels.resolve(channelId);

        if (message.channel.type !== 'text') {
            return l.t('module.raidersinn:howto.response-no-dm');
        }

        return l.t('module.raidersinn:howto.response', { channel });
    }
}

module.exports = CommandHowto;
