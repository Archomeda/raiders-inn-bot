using Discord;
using DiscordBotLib.Localization;
using DiscordBotLib.Utils;

namespace DiscordBotLib.Extensions
{
    /// <summary>
    /// Channel extensions.
    /// </summary>
    public static class ChannelsExtensions
    {
        /// <summary>
        /// Gets the guild configuration.
        /// </summary>
        /// <param name="channel">The Discord channel.</param>
        /// <param name="bot">The bot.</param>
        /// <returns>The guild configuration.</returns>
        public static GuildConfig GetGuildConfig(this IChannel channel, IBot bot)
        {
            Ensure.ArgumentNotNull(bot, nameof(bot));

            ulong guildId = 0;
            switch (channel)
            {
                case IGuildChannel guildChannel:
                    guildId = guildChannel.GuildId;
                    break;
            }
            return bot.GetGuildConfig(guildId);
        }

        /// <summary>
        /// Gets the localizer used for this channel.
        /// </summary>
        /// <param name="channel">The Discord channel.</param>
        /// <param name="bot">The bot.</param>
        /// <returns>The localizer.</returns>
        public static Localizer GetLocalizer(this IChannel channel, IBot bot)
        {
            Ensure.ArgumentNotNull(bot, nameof(bot));

            var guildConfig = channel.GetGuildConfig(bot);
            return new Localizer(guildConfig.LibrarySettings.Language);
        }
    }
}
