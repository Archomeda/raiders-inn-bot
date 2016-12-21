'use strict';

const
    Promise = require('bluebird'),
    i18next = Promise.promisifyAll(require('i18next')),

    CommandAssignmentBase = require('./CommandAssignmentBase');

class CommandAssignEU extends CommandAssignmentBase {
    constructor(module) {
        super(module);
        i18next.loadNamespacesAsync('region-assignment').then(() => {
            this.helpText = i18next.t('region-assignment:assign-eu.help');
            this.shortHelpText = i18next.t('region-assignment:assign-eu.short-help');
        });
    }

    onCommand(response) {
        return this.assignRegionRole(response.message.member, 'eu');
    }
}

module.exports = CommandAssignEU;
