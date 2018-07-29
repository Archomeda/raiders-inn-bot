using System.Reflection;

namespace DiscordBotLib
{
    /// <summary>
    /// Bot settings.
    /// </summary>
    public class BotSettings
    {
        /// <summary>
        /// The bot assembly.
        /// </summary>
        public Assembly Assembly { get; set; }

        /// <summary>
        /// The filename for the embedded config file resource.
        /// </summary>
        public string EmbeddedConfigFileName { get; set; }

        /// <summary>
        /// The config folder.
        /// </summary>
        public string ConfigFolder { get; set; }

        /// <summary>
        /// The local global config file name relative to <see cref="ConfigFolder"/>.
        /// </summary>
        public string ConfigFileName { get; set; }
    }
}
