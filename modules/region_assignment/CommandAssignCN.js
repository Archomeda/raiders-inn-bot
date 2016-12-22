'use strict';

const
    Promise = require('bluebird'),
    i18next = Promise.promisifyAll(require('i18next')),

    CommandAssignmentBase = require('./CommandAssignmentBase');

class CommandAssignCN extends CommandAssignmentBase {
    constructor(module) {
        super(module);
        i18next.loadNamespacesAsync('region-assignment').then(() => {
            this.helpText = i18next.t('region-assignment:assign-cn.help');
            this.shortHelpText = i18next.t('region-assignment:assign-cn.short-help');
        });
    }

    onCommand(response) {
        return this.assignRegionRole(response.message.member, 'cn');
    }
}

module.exports = CommandAssignCN;
