'use strict';

const DiscordCommand = require('../../../../bot/modules/DiscordCommand');


class CommandGear extends DiscordCommand {
    constructor(bot) {
        super(bot, 'gear', ['gear']);
        this._localizerNamespaces = 'module.raidersinn';

        this.removeMiddleware('replyWithMentions');
    }

    async onCommand(message) {
        const bot = this.getBot();
        const l = bot.getLocalizer();

        return l.t('module.raidersinn:gear.response');
    }
}

module.exports = CommandGear;
