using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
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

        /// <summary>
        /// Sends a file to this text channel, with an optional caption.
        /// </summary>
        /// <param name="fileContents">The file contents.</param>
        /// <param name="filename">The filename.</param>
        /// <param name="text">The caption.</param>
        /// <param name="isTTS">Whether text-to-speech should be enabled.</param>
        /// <param name="">The request options.</param>
        /// <returns>The task for this operation.</returns>
        /// <exception cref="ArgumentNullException">Thrown when <paramref name="fileContents"/> is null.</exception>
        public static async Task<IUserMessage> SendFileAsync(this IMessageChannel channel, string fileContents, string filename, string text = null, bool isTTS = false, RequestOptions options = null)
        {
            Ensure.ArgumentNotNull(fileContents, nameof(fileContents));

            using (var ms = new MemoryStream(Encoding.UTF8.GetBytes(fileContents)))
                return await channel.SendFileAsync(ms, filename, text, isTTS, options);
        }
    }
}
