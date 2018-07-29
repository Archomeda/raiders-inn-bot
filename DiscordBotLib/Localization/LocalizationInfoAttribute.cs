using System;

namespace DiscordBotLib.Localization
{
    /// <summary>
    /// Provides information for the localizer where to search for localizations.
    /// </summary>
    /// <seealso cref="Attribute"/>
    [AttributeUsage(AttributeTargets.Class)]
    public class LocalizationInfoAttribute : Attribute
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="LocalizationInfoAttribute"/> class.
        /// </summary>
        /// <param name="baseName">The base name for all localizations.</param>
        public LocalizationInfoAttribute(string baseName)
        {
            this.BaseName = baseName;
        }

        /// <summary>
        /// The base name for all localizations.
        /// </summary>
        public string BaseName { get; set; }
    }
}
