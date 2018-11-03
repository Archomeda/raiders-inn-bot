using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Discord;
using Discord.Commands;
using DiscordBotLib.Extensions;

namespace DiscordBotLib.Commands
{
    [Summary("Utils.Description")]
    public class UtilsModule : ModuleBase
    {
        public CommandService CommandService { get; set; }

        [Command("help")]
        [Alias("?")]
        [Summary("Utils.Help.Description")]
        public async Task Help()
        {
            var localizer = this.GetLocalizer();

            var modules = this.CommandService.Modules.Where(m => !m.IsSubmodule).OrderBy(m => m.Summary);
            string[] modulesHelp = await Task.WhenAll(modules.Select(async m =>
                $"{localizer.Translate("Commands", "Utils.Help.ModulePart", ("description", localizer.Translate("Commands", m.Summary)))}{Environment.NewLine}{await this.FormatModuleHelp(m)}"));

            string message = string
                .Join($"{Environment.NewLine}{Environment.NewLine}", new[] { localizer.Translate("Commands", "Utils.Help", this.Context) }
                .Concat(modulesHelp));

            //TODO Fix long messages as they will fail
            await this.ReplyAsync(message);
        }

        [Command("help")]
        [Alias("?")]
        [Summary("Utils.Help.Single.Description")]
        public async Task Help([Summary("Utils.Help.Single.Command.Description"), Remainder] string command)
        {
            var localizer = this.GetLocalizer();

            var commands = (await this.CommandService.Commands.GetPreconditionedCommands(this.Context))
                .Where(c => c.Aliases[0] == command);
            var module = this.CommandService.Modules.FindModule(command);

            string commandHelp = this.FormatCommandHelp(commands);
            var messageList = new List<string>();
            if (!string.IsNullOrWhiteSpace(commandHelp))
                messageList.Add(commandHelp);

            if (module != null)
            {
                string moduleHelp = await this.FormatModuleHelp(module);
                if (!string.IsNullOrWhiteSpace(moduleHelp))
                    messageList.Add($"{localizer.Translate("Commands", "Utils.Help.Command.Sub")}{Environment.NewLine}{moduleHelp}");
            }

            string message = messageList.Count > 0
                ? $"{localizer.Translate("Commands", "Utils.Help.Command", this.Context)}{Environment.NewLine}{string.Join($"{Environment.NewLine}{Environment.NewLine}", messageList)}"
                : localizer.Translate("Commands", "Utils.Help.Command.DoesNotExist", this.Context);

            //TODO: Fix long messages as they will fail
            await this.ReplyAsync(message);
        }

        [Command("export")]
        [Summary("Utils.Export.Description")]
        [RequireOwner(Group = "export")]
        [RequireUserPermission(GuildPermission.Administrator, Group = "export")]
        public async Task Export()
        {
            var localizer = this.GetLocalizer();
            var messageTask = this.Context.Channel.SendMessageAsync(localizer.Translate("Commands", "Utils.Export.Exporting", this.Context));
            IUserMessage message;

            // Find out all the relevant guilds
            IEnumerable<IGuild> guilds = null;
            switch (this.Context.Message.Channel)
            {
                case IDMChannel dmChannel:
                    var _guilds = await this.Context.Client.GetGuildsAsync();
                    var _guildUsers = await Task.WhenAll(_guilds.Select(g => g.GetUserAsync(this.Context.User.Id)));
                    guilds = _guildUsers
                        .Where(u => u.GuildPermissions.Administrator)
                        .Select(u => u.Guild);
                    break;
                case IGuildChannel guildChannel:
                    guilds = new List<IGuild>() { guildChannel.Guild };
                    break;
                default:
                    //TODO Implement possible error notification
                    return;
            }

            if (guilds.Count() == 0)
            {
                message = await messageTask;
                await message.ModifyAsync(p => p.Content = localizer.Translate("Commands", "Utils.Export.NoGuilds", this.Context));
            }

            // Convert all guilds to strings
            string[] result = await Task.WhenAll(guilds.Select(async g =>
            {
                var channelsTask = g.GetChannelsAsync();
                var membersTask = g.GetUsersAsync();

                var output = new StringBuilder();
                output.AppendLine(localizer.Translate("Commands", "Utils.Export.GuildHeader", ("guild", g)));

                output.AppendLine(localizer.Translate("Commands", "Utils.Export.GuildRoles"));
                foreach (var r in g.Roles.OrderByDescending(r => r.Position))
                    output.AppendLine(localizer.Translate("Commands", "Utils.Export.GuildRolesPart", ("role", r)));

                output.AppendLine();
                output.AppendLine(localizer.Translate("Commands", "Utils.Export.GuildEmojis"));
                foreach (var e in g.Emotes)
                {
                    if (!e.Animated)
                        output.AppendLine(localizer.Translate("Commands", "Utils.Export.GuildEmojisPart", ("emoji", e)));
                    else
                        output.AppendLine(localizer.Translate("Commands", "Utils.Export.GuildEmojisPart.Animated", ("emoji", e)));
                }

                output.AppendLine();
                output.AppendLine(localizer.Translate("Commands", "Utils.Export.GuildChannels"));
                //TODO Order voice channels below text channels
                var channels = (await channelsTask).OrderBy(c => c.Position);
                foreach (var c in channels.Where(c => !c.CategoryId.HasValue && !(c is ICategoryChannel)))
                    output.AppendLine(localizer.Translate("Commands", "Utils.Export.GuildChannelsPart", ("channel", c)));
                foreach (var c in channels.Where(c => c is ICategoryChannel))
                {
                    output.AppendLine(localizer.Translate("Commands", "Utils.Export.GuildChannelsPart", ("channel", c)));
                    foreach (var cc in channels.Where(cc => cc.CategoryId == c.Id))
                        output.AppendLine(localizer.Translate("Commands", "Utils.Export.GuildChannelsPart", ("channel", cc)));
                }

                output.AppendLine();
                output.AppendLine(localizer.Translate("Commands", "Utils.Export.GuildMembers"));
                foreach (var u in (await g.GetUsersAsync()).OrderBy(u => u.JoinedAt))
                {
                    if (string.IsNullOrEmpty(u.Nickname))
                        output.AppendLine(localizer.Translate("Commands", "Utils.Export.GuildMembersPart", ("user", u)));
                    else
                        output.AppendLine(localizer.Translate("Commands", "Utils.Export.GuildMembersPart.Nickname", ("user", u)));
                }

                output.AppendLine();
                return output.ToString();
            }));

            string finalResult = string.Join(Environment.NewLine, result);
            await this.Context.User.SendFileAsync(finalResult, "export.txt", null);

            message = await messageTask;
            await message.ModifyAsync(p => p.Content = localizer.Translate("Commands", "Utils.Export.SentDm", this.Context));
        }


        protected async Task<string> FormatModuleHelp(ModuleInfo module)
        {
            var localizer = this.GetLocalizer();

            var filteredCommands = (await module.Commands.GetPreconditionedCommands(this.Context))
                .Where(c => c.Aliases[0] != module.Aliases[0]);
            var doneCommands = new HashSet<string>();
            var formattedCommands = new List<string>();
            foreach (var command in filteredCommands)
            {
                if (!doneCommands.Contains(command.Aliases[0]))
                {
                    formattedCommands.Add(localizer.Translate("Commands", "Utils.Help.CommandPart", ("description", localizer.Translate("Commands", command.Summary)), ("commandInvocation", command.FormatInvocation(this.Context))));
                    doneCommands.Add(command.Aliases[0]);
                }
            }

            var formattedSubmodules = new HashSet<string>();
            foreach (var submodule in module.Submodules)
            {
                foreach (var command in submodule.Commands)
                {
                    if ((await command.CheckPreconditionsAsync(this.Context)).IsSuccess && command.Aliases[0].EndsWith(submodule.Name))
                    {
                        formattedSubmodules.Add(submodule.Name);
                        if (!doneCommands.Contains(submodule.Aliases[0]))
                        {
                            formattedCommands.Add(localizer.Translate("Commands", "Utils.Help.CommandPart", ("description", localizer.Translate("Commands", submodule.Summary)), ("commandInvocation", command.FormatInvocation(this.Context))));
                            doneCommands.Add(submodule.Aliases[0]);
                            break;
                        }
                    }
                }
            }

            formattedCommands.Sort();
            string formatted = $"{string.Join(Environment.NewLine, formattedCommands)}";
            if (formattedSubmodules.Count > 0)
                formatted += $"{Environment.NewLine}{localizer.Translate("Commands", "Utils.Help.Module.Submodules", ("submodules", string.Join(", ", formattedSubmodules)))}";
            return formatted;
        }

        protected string FormatCommandHelp(IEnumerable<CommandInfo> commands)
        {
            var localizer = this.GetLocalizer();

            var formattedUsage = new List<string>();
            foreach (var command in commands)
            {
                var usage = $"```{command.FormatInvocation(this.Context)} {command.FormatParameters()}```\n{localizer.Translate("Commands", command.Summary)}";
                foreach (var parameter in command.Parameters)
                    usage += $"\n`{parameter.Name}` ({parameter.Type.Name}) - {localizer.Translate("Commands", parameter.Summary)}";
                formattedUsage.Add(usage);
            }

            return string.Join("\n\n", formattedUsage);
        }
    }
}
