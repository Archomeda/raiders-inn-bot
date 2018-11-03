using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Discord;
using DiscordBotLib.Utils;

namespace DiscordBotLib.Extensions
{
    /// <summary>
    /// User extensions.
    /// </summary>
    public static class UserExtensions
    {
        /// <summary>
        /// Sends a file to the user in a DM channel, with an optional caption.
        /// </summary>
        /// <param name="fileContents">The file contents.</param>
        /// <param name="filename">The filename.</param>
        /// <param name="text">The caption.</param>
        /// <param name="isTTS">Whether text-to-speech should be enabled.</param>
        /// <param name="">The request options.</param>
        /// <returns>The task for this operation.</returns>
        /// <exception cref="ArgumentNullException">Thrown when <paramref name="fileContents"/> is null.</exception>
        public static async Task<IUserMessage> SendFileAsync(this IUser user, string fileContents, string filename, string text = null, bool isTTS = false, RequestOptions options = null)
        {
            Ensure.ArgumentNotNull(fileContents, nameof(fileContents));

            using (var ms = new MemoryStream(Encoding.UTF8.GetBytes(fileContents)))
                return await user.SendFileAsync(ms, filename, text, isTTS, options);
        }
    }
}
