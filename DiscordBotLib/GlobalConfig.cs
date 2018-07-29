using System;
using System.IO;
using System.Threading.Tasks;
using Discord;
using DiscordBotLib.Utils;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace DiscordBotLib
{
    /// <summary>
    /// A global bot config.
    /// </summary>
    public class GlobalConfig
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="GlobalConfig"/> class.
        /// </summary>
        /// <param name="bot">The bot instance.</param>
        public GlobalConfig(IBot bot)
        {
            Ensure.ArgumentNotNull(bot, nameof(bot));

            this.Bot = bot;
        }

        /// <summary>
        /// The bot instance.
        /// </summary>
        public IBot Bot { get; private set; }

        /// <summary>
        /// The actual config settings.
        /// </summary>
        public Config Settings { get; private set; }

        /// <summary>
        /// Loads a bot configuration from a stream.
        /// The following defined environment variables override the file settings:
        /// <list type="bullet">
        /// <item><description>MONGO_URI: <see cref="MongoConfig.Uri"/></description></item>
        /// </list>
        /// </summary>
        /// <param name="defaultConfigStream">The stream for the default configuration file.</param>
        /// <param name="configFileName">The file name of the local configuration.</param>
        /// <returns></returns>
        public async Task<bool> Load(Stream defaultConfigStream, string configFileName)
        {
            Ensure.ArgumentNotNull(defaultConfigStream, nameof(defaultConfigStream));
            Ensure.ArgumentNotNull(configFileName, nameof(configFileName));

            if (!await this.EnsureConfigFile(defaultConfigStream, configFileName))
                return false;

            this.Settings = this.DeserializeConfigFile(configFileName);
            this.OverrideEnvironment();
            return true;
        }

        private async Task<bool> EnsureConfigFile(Stream defaultConfigStream, string configFileName)
        {
            if (!File.Exists(configFileName))
            {
                var directory = Path.GetDirectoryName(configFileName);
                if (!Directory.Exists(directory))
                    Directory.CreateDirectory(directory);

                using (var destStream = File.OpenWrite(configFileName))
                    await defaultConfigStream?.CopyToAsync(destStream);

                this.Bot.LogMessage("BotLib", $"The local config file has been created as {configFileName}. Please check the settings and make modifications where necessary before starting the bot again.");
                return false;
            }
            return true;
        }

        private Config DeserializeConfigFile(string configFileName)
        {
            using (var reader = new StreamReader(configFileName))
            {
                var deserializer = new DeserializerBuilder()
                    .WithNamingConvention(new HyphenatedNamingConvention())
                    .IgnoreUnmatchedProperties()
                    .Build();
                return deserializer.Deserialize<Config>(reader);
            }
        }

        private void OverrideEnvironment()
        {
            var mongo = Environment.GetEnvironmentVariable("MONGO_URI");
            if (!string.IsNullOrWhiteSpace(mongo))
                this.Settings.Mongo.Uri = mongo;
        }


        /// <summary>
        /// A global config object.
        /// </summary>
        public class Config
        {
            /// <summary>
            /// The bot's Discord token.
            /// </summary>
            public string DiscordToken { get; set; }

            /// <summary>
            /// The bot's owner's account id.
            /// </summary>
            public ulong Owner { get; set; }

            /// <summary>
            /// The MongoDB config.
            /// </summary>
            public MongoConfig Mongo { get; set; }

            /// <summary>
            /// The Redis config.
            /// </summary>
            public RedisConfig Redis { get; set; }
        }

        /// <summary>
        /// A MongoDB config object.
        /// </summary>
        public class MongoConfig
        {
            /// <summary>
            /// The MongoDB connection URI.
            /// </summary>
            public string Uri { get; set; }
        }

        public class RedisConfig
        {
            /// <summary>
            /// The Redis connection options.
            /// See https://stackexchange.github.io/StackExchange.Redis/Configuration#configuration-options for more info.
            /// </summary>
            public string Options { get; set; }
        }
    }
}
