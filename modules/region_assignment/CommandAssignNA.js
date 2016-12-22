'use strict';

const
    Promise = require('bluebird'),
    i18next = Promise.promisifyAll(require('i18next')),

    CommandAssignmentBase = require('./CommandAssignmentBase');

class CommandAssignNA extends CommandAssignmentBase {
    constructor(module) {
        super(module);
        i18next.loadNamespacesAsync('region-assignment').then(() => {
            this.helpText = i18next.t('region-assignment:assign-na.help');
            this.shortHelpText = i18next.t('region-assignment:assign-na.short-help');
        });
    }

    onCommand(response) {
        return this.assignRegionRole(response.message.member, 'na');
    }
}

module.exports = CommandAssignNA;
