'use strict';

const
    Promise = require('bluebird'),
    i18next = Promise.promisifyAll(require('i18next')),

    CommandAssignmentBase = require('./CommandAssignmentBase');

class CommandRemoveNA extends CommandAssignmentBase {
    constructor(module) {
        super(module);
        i18next.loadNamespacesAsync('region-assignment').then(() => {
            this.helpText = i18next.t('region-assignment:remove-na.help');
            this.shortHelpText = i18next.t('region-assignment:remove-na.short-help');
        });
    }

    onCommand(response) {
        return this.removeRegionRole(response.message.member, 'na');
    }
}

module.exports = CommandRemoveNA;
