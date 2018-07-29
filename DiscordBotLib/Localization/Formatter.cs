using System;
using Discord;
using Discord.Commands;
using Discord.WebSocket;
using DiscordBotLib.Extensions;

namespace DiscordBotLib.Localization
{
    /// <summary>
    /// A custom formatter for the bot.
    /// </summary>
    /// <seealso cref="IFormatProvider" />
    /// <seealso cref="ICustomFormatter" />
    public class Formatter : IFormatProvider, ICustomFormatter
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="Formatter"/> class.
        /// </summary>
        /// <param name="parentFormatter">The parent formatter.</param>
        public Formatter(IFormatProvider parentFormatter)
        {
            this.ParentFormatter = parentFormatter;
        }

        /// <summary>
        /// The parent formatter.
        /// </summary>
        public IFormatProvider ParentFormatter { get; set; }

        /// <summary>
        /// Returns an object that provides formatting services for the specified type.
        /// </summary>
        /// <param name="formatType">An object that specifies the type of format object to return.</param>
        /// <returns>
        /// An instance of the object specified by <paramref name="formatType">formatType</paramref>, if the <see cref="T:System.IFormatProvider"></see> implementation can supply that type of object; otherwise, null.
        /// </returns>
        /// <exception cref="NotImplementedException"></exception>
        public object GetFormat(Type formatType)
        {
            if (formatType == typeof(ICustomFormatter))
                return this;
            return null;
        }

        /// <summary>
        /// Converts the value of a specified object to an equivalent string representation using specified format and culture-specific formatting information.
        /// </summary>
        /// <param name="format">A format string containing formatting specifications.</param>
        /// <param name="arg">An object to format.</param>
        /// <param name="formatProvider">An object that supplies format information about the current instance.</param>
        /// <returns>
        /// The string representation of the value of <paramref name="arg">arg</paramref>, formatted as specified by <paramref name="format">format</paramref> and <paramref name="formatProvider">formatProvider</paramref>.
        /// </returns>
        /// <exception cref="NotImplementedException"></exception>
        public string Format(string format, object arg, IFormatProvider formatProvider)
        {
            switch (format?.ToLower())
            {
                case "mention":
                    switch (arg)
                    {
                        case IRole role:
                            return role.IsMentionable ? role.Mention : role.Name;
                        case IMentionable mentionable:
                            return mentionable.Mention;
                    }
                    break;
                case "name":
                    switch (arg)
                    {
                        case IUser user:
                            return user.Username;
                        case ModuleInfo module:
                            return module.Name;
                        case CommandInfo command:
                            return command.Name;
                    }
                    break;
                case "summary":
                    switch (arg)
                    {
                        case ModuleInfo module:
                            return module.Summary;
                        case CommandInfo command:
                            return command.Summary;
                    }
                    break;

            }

            if (arg is IFormattable)
                return ((IFormattable)arg).ToString(format, this.ParentFormatter);
            return arg.ToString();
        }
    }
}
