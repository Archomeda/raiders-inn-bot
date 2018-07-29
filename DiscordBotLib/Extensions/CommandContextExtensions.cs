using Discord.Commands;

namespace DiscordBotLib.Extensions
{
    /// <summary>
    /// Command context extensions.
    /// </summary>
    public static class CommandContextExtensions
    {
        /// <summary>
        /// Gets the guild configuration.
        /// </summary>
        /// <param name="context">The command context.</param>
        /// <returns>The guild configuration.</returns>
        public static GuildConfig GetGuildConfig(this ICommandContext context) =>
            context.Channel.GetGuildConfig(context.Client.GetBot());
    }
}
