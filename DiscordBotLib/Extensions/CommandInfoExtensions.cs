using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Discord;
using Discord.Commands;

namespace DiscordBotLib.Extensions
{
    /// <summary>
    /// Command info extensions.
    /// </summary>
    public static class CommandInfoExtensions
    {
        /// <summary>
        /// Formats the main command invocation string.
        /// </summary>
        /// <param name="command">The command.</param>
        /// <param name="context">The command context.</param>
        /// <returns>The invocation string.</returns>
        public static string FormatInvocation(this CommandInfo command, ICommandContext context)
        {
            switch (context.Channel)
            {
                case ITextChannel textChannel:
                    var config = context.GetGuildConfig();
                    return $"{config.LibrarySettings.CommandPrefix}{command.Aliases[0]}";
                default:
                    return command.Aliases[0];
            }
        }

        /// <summary>
        /// Formats the parameters.
        /// </summary>
        /// <param name="command">The command.</param>
        /// <returns>The parameters.</returns>
        public static string FormatParameters(this CommandInfo command)
        {
            return string.Join(" ", command.Parameters.Select(p =>
            {
                if (p.IsOptional)
                {
                    if (p.DefaultValue != null)
                        return $"[{p.Name}={p.DefaultValue}]";
                    return $"[{p.Name}]";
                }
                return $"<{p.Name}>";
            }));
        }

        /// <summary>
        /// Gets the commands that pass the precondition.
        /// </summary>
        /// <param name="module">The module.</param>
        /// <param name="context">The context.</param>
        /// <returns>A list of commands that pass the precondition.</returns>
        public static async Task<IEnumerable<CommandInfo>> GetPreconditionedCommands(this IEnumerable<CommandInfo> commands, ICommandContext context)
        {
            var result = new List<CommandInfo>();
            foreach (var command in commands)
                if ((await command.CheckPreconditionsAsync(context)).IsSuccess)
                    result.Add(command);
            return result;
        }
    }
}
