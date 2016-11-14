'use strict';

const
    _ = require('lodash'),

    Middleware = require('../Middleware'),
    MiddlewareError = require('../../errors/MiddlewareError');

class RestrictPermissionsMiddleware extends Middleware {
    constructor(options) {
        super(options);
        const defaultOptions = {
            permissions: {}
        };
        this.options = Object.assign({}, defaultOptions, options);
    }

    onCommand(response) {
        if (!this.isCommandAllowed(response.message, response.command, response.params)) {
            const username = `${response.message.author.username}#${response.message.author.discriminator}`;
            throw new MiddlewareError(
                `Access to command denied by permissions (command: ${response.command.trigger}, user ${username}`,
                'log',
                `You don't have permission to access this command.`
            );
        }
        return response;
    }

    isCommandAllowed(message, command, params) {
        let allowed;
        for (let name in this.options.permissions) {
            if (this.options.permissions.hasOwnProperty(name)) {
                // Check for each permission group to see if the user is added as a user or as a role
                const group = this.options.permissions[name];
                if ((group.user_ids && group.user_ids.includes(message.author.id)) ||
                    (message.member && group.role_ids && _.intersection(group.role_ids, message.member.roles.keyArray()).length > 0)) {
                    if (this.isPermissionInList(group.blacklist, command.permissionId)) {
                        // Command explicitly disallowed
                        allowed = false;
                        break;
                    } else if (this.isPermissionInList(group.whitelist, command.permissionId)) {
                        // Command explicitly allowed
                        allowed = true;
                        break;
                    }
                }

            }
        }

        if (allowed === undefined) {
            // Check default group
            if (this.options.permissions.default.blacklist.length > 0) {
                // Check blacklist
                allowed = !this.isPermissionInList(this.options.permissions.default.blacklist, command.permissionId);
            } else if (this.options.permissions.default.whitelist.length > 0) {
                // Check whitelist
                allowed = this.isPermissionInList(this.options.permissions.default.whitelist, command.permissionId);
            } else {
                // Blacklist and whitelist are empty, assume allow
                allowed = true;
            }
        }

        return allowed;
    }

    isPermissionInList(list, permissionId) {
        return list.some(p => permissionId.match(new RegExp(`^${p.replace('.', '\\.').replace('*', '.*')}$`)));
    }

    static isCommandAllowed(message, command) {
        // Find RestrictPermissionsMiddleware instance on command
        const middleware = command.allMiddleware.find(m => m.name === 'RestrictPermissionsMiddleware');
        if (!middleware) {
            return true;
        }
        return middleware.isCommandAllowed(message, command);
    }
}

module.exports = RestrictPermissionsMiddleware;
