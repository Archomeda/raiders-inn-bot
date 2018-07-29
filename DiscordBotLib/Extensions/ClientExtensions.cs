using Discord;

namespace DiscordBotLib.Extensions
{
    /// <summary>
    /// Discord client extensions.
    /// </summary>
    public static class ClientExtensions
    {
        /// <summary>
        /// Gets the bot instance.
        /// </summary>
        /// <param name="client">The Discord client.</param>
        /// <returns>The bot instance.</returns>
        public static IBot GetBot(this IDiscordClient client) =>
            Bot.ClientBots[client.CurrentUser.Id];
    }
}
