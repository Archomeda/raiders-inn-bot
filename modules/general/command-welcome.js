'use strict';

const
    config = require('config'),

    CommandBase = require('../command-base');

class CommandWelcome extends CommandBase {
    constructor(module) {
        super(module);

        this.id = 'welcome';
        this.name = config.get('modules.general.command_welcome');
        this.helpText = 'Welcomes people to the server and directs them to the read-first channel.';
        this.shortHelpText = 'Welcomes people to the server';
        this.cooldownType = 'user';
        this.supportedDeliveryTypes = 'mention';
        this.listenChannelTypes = 'text';
    }

    onCommand(message, params) {
        const welcomeChannel = message.guild.channels.get(config.get('modules.general.welcome_channel'));
        return (
            `Welcome to The Raiders Inn! Be sure to head over to ${welcomeChannel} to get started. ` +
            'You will find our rules and general information there. ' +
            `Don't forget to assign yourself to a server!\n\n` +
            'Enjoy your stay! :beers:'
        );
    }
}

module.exports = CommandWelcome;
