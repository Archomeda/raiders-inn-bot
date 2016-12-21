'use strict';

const
    Promise = require('bluebird'),
    i18next = Promise.promisifyAll(require('i18next')),

    CommandAssignmentBase = require('./CommandAssignmentBase');

class CommandRemoveCN extends CommandAssignmentBase {
    constructor(module) {
        super(module);
        i18next.loadNamespacesAsync('region-assignment').then(() => {
            this.helpText = i18next.t('region-assignment:remove-cn.help');
            this.shortHelpText = i18next.t('region-assignment:remove-cn.short-help');
        });
    }

    onCommand(response) {
        return this.removeRegionRole(response.message.member, 'cn');
    }
}

module.exports = CommandRemoveCN;
