'use strict';

const DiscordHook = require('../../../../bot/modules/DiscordHook');


class HookRoleAssignment extends DiscordHook {
    constructor(bot) {
        super(bot, 'role-assignment');
        this._hooks = {
            messageReactionAdd: this.onAdd.bind(this),
            messageReactionRemove: this.onRemove.bind(this)
        };
        this._localizerNamespaces = 'module.guildwars2';
    }

    async applyProfessionRole(reaction, user, isAdded) {
        if (user.bot) {
            // Ignore bots
            return;
        }

        const config = this.getConfig();
        const moduleConfig = this.getModule().getConfig();
        const messageId = config.get('message-id');
        if (reaction.message.id !== messageId) {
            // Not the right message
            return;
        }

        const guild = reaction.message.guild;
        if (!guild) {
            // Not a guild
            return;
        }

        const member = await reaction.message.guild.members.fetch(user);
        if (!member) {
            // Not a member
            return;
        }

        const roleAssignments = config.get('roles');
        const emojiToRole = new Map();
        for (const role of roleAssignments) {
            emojiToRole.set(role['emoji-id'], role['role-id']);
        }

        const raiderRoleId = moduleConfig.get('raider.enabled') ? moduleConfig.get('raider.role-id') : undefined;
        const roleId = emojiToRole.get(reaction.emoji.id || reaction.emoji.name);
        if (roleId && guild.roles.has(roleId)) {
            if (isAdded) {
                // Apply roles
                if (!member.roles.has(roleId)) {
                    await member.addRole(roleId, 'Raid role assignment applied via message reaction');
                }
                // Apply raider
                if (raiderRoleId && guild.roles.has(raiderRoleId) && !member.roles.has(raiderRoleId)) {
                    await member.addRole(raiderRoleId, 'Raid role assignment implies raider role');
                }
            } else {
                // Remove raid role
                if (member.roles.has(roleId)) {
                    await member.removeRole(roleId, 'Raid role assignment removed via message reaction');
                }
                // Remove raider if no raid roles have been assigned
                const roleIds = Array.from(emojiToRole.values());
                if (member.roles.filterArray(r => roleIds.includes(r.id)).length === 0) {
                    await member.removeRole(raiderRoleId, 'No raid role assignments implies no raider role');
                }
            }
        } else if (isAdded) {
            // Role doesn't exist, remove reaction
            await reaction.remove(user);
        }
    }

    async onAdd(reaction, user) {
        return this.applyProfessionRole(reaction, user, true);
    }

    async onRemove(reaction, user) {
        return this.applyProfessionRole(reaction, user, false);
    }

    async enableHook() {
        const client = this.getBot().getClient();
        const config = this.getConfig();
        const channel = client.channels.get(config.get('channel-id'));
        if (channel) {
            const message = await channel.messages.fetch(config.get('message-id'));
            if (message) {
                const roleAssignments = config.get('roles');
                if (roleAssignments && roleAssignments.length > 0) {
                    const emojis = roleAssignments.map(r => r['emoji-id']);

                    // Apply our reactions to it if they don't exist yet
                    for (const emoji of emojis) {
                        const reaction = message.reactions.get(emoji) || message.reactions.find('id', emoji) || message.reactions.find('name', emoji);
                        if (!reaction || !reaction.me) {
                            try {
                                await message.react(emoji); // eslint-disable-line no-await-in-loop
                            } catch (err) {
                                // Reacting failed, possibly because the emoji doesn't exist
                                this.log(`Reacting on profession assignment message failed: ${err}`, 'warn');
                            }
                        }
                    }

                    // Remove unsupported reactions
                    const exec = [];
                    for (const reaction of message.reactions.filterArray(r => !emojis.includes(r.emoji.id) && !emojis.includes(r.emoji.name))) {
                        // .fetchUsers() is hardcapped at 100 users at a time
                        const users = (await reaction.fetchUsers()).keyArray(); // eslint-disable-line no-await-in-loop
                        for (const user of users) {
                            exec.push(reaction.remove(user));
                        }
                    }
                    await Promise.all(exec);
                }
            }
        }

        return super.enableHook();
    }
}

module.exports = HookRoleAssignment;
