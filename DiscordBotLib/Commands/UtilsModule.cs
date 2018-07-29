using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
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
            var modulesHelp = await Task.WhenAll(modules.Select(async m =>
                $"{localizer.Translate("Commands", "Utils.Help.ModulePart", ("description", localizer.Translate("Commands", m.Summary)))}\n{await this.FormatModuleHelp(m)}"));

            var message = string.Join("\n\n", new[] { localizer.Translate("Commands", "Utils.Help", this.Context) }.Concat(modulesHelp));
            //TODO: Fix long messages as they will fail
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

            var commandHelp = this.FormatCommandHelp(commands);
            var messageList = new List<string>();
            if (!string.IsNullOrWhiteSpace(commandHelp))
                messageList.Add(commandHelp);

            if (module != null)
            {
                var moduleHelp = await this.FormatModuleHelp(module);
                if (!string.IsNullOrWhiteSpace(moduleHelp))
                    messageList.Add($"{localizer.Translate("Commands", "Utils.Help.Command.Sub")}\n{moduleHelp}");
            }

            string message;
            if (messageList.Count > 0)
                message = $"{localizer.Translate("Commands", "Utils.Help.Command", this.Context)}\n{string.Join("\n\n", messageList)}";
            else
                message = localizer.Translate("Commands", "Utils.Help.Command.DoesNotExist", this.Context);
            //TODO: Fix long messages as they will fail
            await this.ReplyAsync(message);
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
            var formatted = $"{string.Join("\n", formattedCommands)}";
            if (formattedSubmodules.Count > 0)
                formatted += $"\n{localizer.Translate("Commands", "Utils.Help.Module.Submodules", ("submodules", string.Join(", ", formattedSubmodules)))}";
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
