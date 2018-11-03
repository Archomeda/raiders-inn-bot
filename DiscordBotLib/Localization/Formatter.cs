using System;
using Discord;
using Discord.Commands;

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
                case "id":
                    switch (arg)
                    {
                        case ISnowflakeEntity snowflakeEntity:
                            return snowflakeEntity.Id.ToString();
                    }
                    break;
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
                        case IChannel channel:
                            return channel.Name;
                        case IEmote emoji:
                            return emoji.Name;
                        case IGuild guild:
                            return guild.Name;
                        case IGuildUser member:
                            return member.Nickname ?? member.Username;
                        case IRole role:
                            return role.Name;
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
                case "type":
                    switch (arg)
                    {
                        case ICategoryChannel categoryChannel:
                            return "category";
                        case IDMChannel dmChannel:
                            return "dm";
                        case IGroupChannel groupChannel:
                            return "group";
                        case ITextChannel textChannel:
                            return "text";
                        case IVoiceChannel voiceChannel:
                            return "voice";
                    }
                    break;
                case "username":
                    switch (arg)
                    {
                        case IUser user:
                            return $"{user.Username}#{user.Discriminator}";
                    }
                    break;
            }

            return arg is IFormattable formattableArg
                ? formattableArg.ToString(format, this.ParentFormatter)
                : arg.ToString();
        }
    }
}
