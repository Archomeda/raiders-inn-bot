'use strict';

const
    Promise = require('bluebird'),
    i18next = Promise.promisifyAll(require('i18next')),

    CommandAssignmentBase = require('./CommandAssignmentBase');

class CommandRemoveEU extends CommandAssignmentBase {
    constructor(module) {
        super(module);
        i18next.loadNamespacesAsync('region-assignment').then(() => {
            this.helpText = i18next.t('region-assignment:remove-eu.help');
            this.shortHelpText = i18next.t('region-assignment:remove-eu.short-help');
        });
    }

    onCommand(response) {
        return this.removeRegionRole(response.message.member, 'eu');
    }
}

module.exports = CommandRemoveEU;
