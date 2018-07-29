using Discord.Commands;
using DiscordBotLib.Localization;

namespace DiscordBotLib.Extensions
{
    /// <summary>
    /// Module extensions.
    /// </summary>
    public static class ModuleExtensions
    {
        /// <summary>
        /// Gets the localizer for this module with its context.
        /// </summary>
        /// <param name="module">The module.</param>
        /// <returns>The localizer.</returns>
        public static Localizer GetLocalizer(this ModuleBase module) =>
            module.Context.Channel.GetLocalizer(module.Context.Client.GetBot());
    }
}
