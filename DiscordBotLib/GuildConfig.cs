using System;
using System.ComponentModel;
using System.IO;
using Discord;
using DiscordBotLib.Utils;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace DiscordBotLib
{
    /// <summary>
    /// A Discord guild config.
    /// </summary>
    public class GuildConfig
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="GuildConfig"/> class.
        /// </summary>
        /// <param name="bot">The bot instance.</param>
        public GuildConfig(IBot bot, string configFolder, ulong guildId)
        {
            Ensure.ArgumentNotNull(bot, nameof(bot));

            this.Bot = bot;
            this.GuildId = guildId;
            this.ConfigFileName = Path.Combine(configFolder, $"guild_{guildId}.yml");
        }

        private object settings;

        /// <summary>
        /// The bot instance.
        /// </summary>
        public IBot Bot { get; private set; }

        /// <summary>
        /// The bot library settings.
        /// </summary>
        public LibraryConfig LibrarySettings { get; private set; } = new LibraryConfig();

        /// <summary>
        /// The untyped bot instance settings.
        /// </summary>
        public INotifyPropertyChanged BotSettings { get; private set; }

        /// <summary>
        /// The bot instance settings.
        /// </summary>
        public TConfig BotSettingsAs<TConfig>() where TConfig : INotifyPropertyChanged, new() => (TConfig)this.BotSettings;

        /// <summary>
        /// The Discord guild id.
        /// </summary>
        public ulong GuildId { get; private set; }

        /// <summary>
        /// The guild config file name.
        /// </summary>
        public string ConfigFileName { get; private set; }

        /// <summary>
        /// Loads the guild configuration.
        /// </summary>
        /// <typeparam name="TConfig">The type of the guild config object.</typeparam>
        public void Load<TConfig>() where TConfig : INotifyPropertyChanged, new() =>
            this.Load(typeof(TConfig));

        /// <summary>
        /// Loads the guild configuration.
        /// </summary>
        /// <param name="type">The type of the guild config object.</param>
        public void Load(Type type)
        {
            if (File.Exists(this.ConfigFileName))
            {
                var config = this.DeserializeConfigFile(this.ConfigFileName, type);
                this.settings = config.Settings;
                this.LibrarySettings = config.LibrarySettings;
                this.BotSettings = config.BotSettings;
            }
            else
            {
                var configType = typeof(Config<>).MakeGenericType(type);
                this.settings = Activator.CreateInstance(configType);
                this.LibrarySettings = (LibraryConfig)configType.GetProperty("Lib").GetValue(this.settings);
                this.BotSettings = (INotifyPropertyChanged)configType.GetProperty("Bot").GetValue(this.settings);
            }
            this.LibrarySettings.PropertyChanged += this.Config_PropertyChanged;
            this.BotSettings.PropertyChanged += this.Config_PropertyChanged;
        }

        private void Config_PropertyChanged(object sender, PropertyChangedEventArgs e) =>
            this.SerializeConfigFile(this.ConfigFileName);

        private (object Settings, LibraryConfig LibrarySettings, INotifyPropertyChanged BotSettings) DeserializeConfigFile(string configFileName, Type type)
        {
            using (var reader = new StreamReader(configFileName))
            {
                var deserializer = new DeserializerBuilder()
                    .WithNamingConvention(new HyphenatedNamingConvention())
                    .IgnoreUnmatchedProperties()
                    .Build();
                var serializedType = typeof(Config<>).MakeGenericType(type);
                var config = deserializer.Deserialize(reader, serializedType);

                return (
                    config,
                    (LibraryConfig)serializedType.GetProperty("Lib").GetValue(config),
                    (INotifyPropertyChanged)serializedType.GetProperty("Bot").GetValue(config)
                );
            }
        }

        private void SerializeConfigFile(string configFileName)
        {
            using (var writer = new StreamWriter(configFileName))
            {
                var serializer = new SerializerBuilder()
                    .WithNamingConvention(new HyphenatedNamingConvention())
                    .Build();
                serializer.Serialize(writer, this.settings);
            }
        }


        /// <summary>
        /// A Discord guild config object.
        /// </summary>
        /// <typeparam name="TConfig">The type of the guild config object.</typeparam>
        internal class Config<TConfig> where TConfig : INotifyPropertyChanged, new()
        {
            /// <summary>
            /// The bot library settings.
            /// </summary>
            public LibraryConfig Lib { get; set; } = new LibraryConfig();

            /// <summary>
            /// The bot instance settings.
            /// </summary>
            public TConfig Bot { get; set; } = new TConfig();
        }

        /// <summary>
        /// A Discord guild library config object.
        /// </summary>
        public class LibraryConfig : GuildSettingsBase
        {
            /// <summary>
            /// The command prefix.
            /// </summary>
            public string CommandPrefix
            {
                get => this.commandPrefix;
                set => this.SetField(ref this.commandPrefix, value);
            }
            private string commandPrefix = "!";

            /// <summary>
            /// The language.
            /// </summary>
            public string Language
            {
                get => this.language;
                set => this.SetField(ref this.language, value);
            }
            private string language = "en";

            /// <summary>
            /// The bot's activity type.
            /// </summary>
            public ActivityType ActivityType
            {
                get => this.activityType;
                set => this.SetField(ref this.activityType, value);
            }
            private ActivityType activityType = ActivityType.Playing;

            /// <summary>
            /// The bot's activity text.
            /// </summary>
            public string ActivityText
            {
                get => this.activityText;
                set => this.SetField(ref this.activityText, value);
            }
            private string activityText = null;

        }
    }
}
