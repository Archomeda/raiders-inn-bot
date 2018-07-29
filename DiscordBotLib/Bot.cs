using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.IO;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using Discord;
using Discord.Commands;
using Discord.WebSocket;
using DiscordBotLib.Extensions;
using DiscordBotLib.Localization;
using DiscordBotLib.Utils;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Driver;
using StackExchange.Redis;

namespace DiscordBotLib
{
    /// <summary>
    /// A Discord bot.
    /// </summary>
    /// <typeparam name="TConfig">The type of the guild config object.</typeparam>
    [LocalizationInfo(nameof(DiscordBotLib) + "." + nameof(Locales))]
    public class Bot : IBot
    {
        public const string LogSource = "BotLib";

        internal static readonly Dictionary<ulong, IBot> ClientBots = new Dictionary<ulong, IBot>();


        /// <summary>
        /// Initializes a new instance of the <see cref="Bot"/> class.
        /// </summary>
        /// <param name="discordConfig">The discord configuration.</param>
        public Bot(DiscordSocketConfig discordConfig)
        {
            this.GlobalConfig = new GlobalConfig(this);
            this.DiscordClient = new DiscordSocketClient(discordConfig);
            this.DiscordCommandService = new CommandService(new CommandServiceConfig
            {
                CaseSensitiveCommands = false
            });

            this.DiscordClient.Connected += this.DiscordClient_Connected;
            this.DiscordClient.Disconnected += this.DiscordClient_Disconnected;
            this.DiscordClient.Log += this.DiscordClient_Log;
            this.DiscordClient.MessageReceived += this.DiscordClient_MessageReceived;
        }

        private BotSettings botSettings;
        private Type configType;
        private readonly AutoResetEvent exitResetEvent = new AutoResetEvent(false);
        private readonly Dictionary<ulong, GuildConfig> guildConfigs = new Dictionary<ulong, GuildConfig>();

        /// <summary>
        /// The global bot configuration.
        /// </summary>
        public GlobalConfig GlobalConfig { get; private set; }

        /// <summary>
        /// The Discord client.
        /// </summary>
        public DiscordSocketClient DiscordClient { get; private set; }

        /// <summary>
        /// The Discord command service.
        /// </summary>
        public CommandService DiscordCommandService { get; private set; }

        /// <summary>
        /// The Discord services.
        /// </summary>
        public IServiceProvider DiscordServices { get; private set; }

        /// <summary>
        /// The MongoDB client.
        /// </summary>
        public MongoClient MongoClient { get; private set; }

        /// <summary>
        /// The Redis client.
        /// </summary>
        public ConnectionMultiplexer RedisClient { get; private set; }

        /// <summary>
        /// Occurs on Discord bot logging.
        /// </summary>
        public event EventHandler<BotLogEventArgs> Log;


        /// <summary>
        /// Gets the guild bot configuration.
        /// Guild id 0 is the default configuration.
        /// </summary>
        /// <param name="guildId">The guild id.</param>
        /// <returns>The guild configuration.</returns>
        public GuildConfig GetGuildConfig(ulong guildId)
        {
            if (!this.guildConfigs.ContainsKey(guildId))
            {
                this.guildConfigs[guildId] = new GuildConfig(this, this.botSettings.ConfigFolder, guildId);
                this.guildConfigs[guildId].Load(this.configType);
            }
            return this.guildConfigs[guildId];
        }
        
        /// <summary>
        /// Initializes all commands found in the current AppDomain.
        /// </summary>
        public async Task InitializeCommands()
        {
            foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
                await this.InitializeCommands(assembly);
        }

        /// <summary>
        /// Initializes all commands in the given assembly.
        /// </summary>
        /// <param name="assembly">The assembly.</param>
        public Task InitializeCommands(Assembly assembly) => this.DiscordCommandService.AddModulesAsync(assembly);

        /// <summary>
        /// Starts the bot.
        /// </summary>
        /// <param name="botSettings">The bot settings.</param>
        public async Task<bool> Start<TConfig>(BotSettings botSettings) where TConfig : INotifyPropertyChanged, new()
        {
            Ensure.ArgumentNotNull(botSettings, nameof(botSettings));

            this.botSettings = botSettings;
            this.configType = typeof(TConfig);

            using (var stream = botSettings.Assembly.GetManifestResourceStream(botSettings.EmbeddedConfigFileName))
                if (!await this.GlobalConfig.Load(stream, Path.Combine(botSettings.ConfigFolder, botSettings.ConfigFileName)))
                    return false;

            this.guildConfigs[0] = new GuildConfig(this, botSettings.ConfigFolder, 0);
            this.guildConfigs[0].Load<TConfig>();

            Task ConnectMongo()
            {
                if (this.GlobalConfig.Settings.Mongo == null || string.IsNullOrWhiteSpace(this.GlobalConfig.Settings.Mongo.Uri))
                {
                    this.LogMessage(LogSource, "MongoDB settings not configured, skipping...");
                    this.LogMessage(LogSource, "If you want MongoDB support, please check your configuration key mongo.uri");
                    return Task.CompletedTask;
                }

                this.MongoClient = new MongoClient(this.GlobalConfig.Settings.Mongo.Uri);
                this.LogMessage(LogSource, "MongoDB ready");
                return Task.CompletedTask;
            }

            async Task ConnectRedis()
            {
                if (this.GlobalConfig.Settings.Redis == null || string.IsNullOrWhiteSpace(this.GlobalConfig.Settings.Redis.Options))
                {
                    this.LogMessage(LogSource, "Redis settings not configured, skipping...");
                    this.LogMessage(LogSource, "If you want Redis support, please check your configuration key redis.options");
                    return;
                }

                this.RedisClient = await ConnectionMultiplexer.ConnectAsync(this.GlobalConfig.Settings.Redis.Options);
                this.LogMessage(LogSource, "Redis ready");
            }

            await Task.WhenAll(
                this.DiscordClient.LoginAsync(TokenType.Bot, this.GlobalConfig.Settings.DiscordToken),
                ConnectMongo(),
                ConnectRedis()
            );

            this.DiscordServices = new ServiceCollection().BuildServiceProvider();

            await this.DiscordClient.StartAsync();

            return true;
        }

        /// <summary>
        /// Signals <see cref="BlockUntilExit"/> to stop.
        /// </summary>
        public void Stop() =>
            this.exitResetEvent.Set();

        /// <summary>
        /// A helper method to keep the program running until it's exiting or forced to exit.
        /// </summary>
        public void BlockUntilExit()
        {
            Console.CancelKeyPress -= CancelKeyPress;
            Console.CancelKeyPress += CancelKeyPress;

            void CancelKeyPress(object sender, ConsoleCancelEventArgs e)
            {
                e.Cancel = true;
                this.exitResetEvent.Set();
            }

            this.exitResetEvent.WaitOne(Timeout.Infinite);
        }

        /// <summary>
        /// Logs a message.
        /// </summary>
        /// <param name="sender">The sender.</param>
        /// <param name="message">The message.</param>
        public void LogMessage(string source, string message) => this.Log?.Invoke(this, new BotLogEventArgs($"[{source}] {message}"));


        private async Task DiscordClient_Connected()
        {
            this.LogMessage(LogSource, "Connected to Discord");
            ClientBots[this.DiscordClient.CurrentUser.Id] = this;

            var config = this.GetGuildConfig(0).LibrarySettings;
            if (!string.IsNullOrWhiteSpace(config.ActivityText))
                await this.DiscordClient.SetActivityAsync(new Game(config.ActivityText, config.ActivityType));
        }

        private Task DiscordClient_Disconnected(Exception arg)
        {
            this.LogMessage(LogSource, "Disconnected from Discord");
            return Task.CompletedTask;
        }

        private Task DiscordClient_Log(LogMessage message)
        {
            this.LogMessage(message.Source, message.Exception?.ToString() ?? message.Message);
            return Task.CompletedTask;
        }

        private async Task DiscordClient_MessageReceived(SocketMessage socketMessage)
        {
            if (!(socketMessage is SocketUserMessage message))
                return;
            if (!(message.Channel is IMessageChannel messageChanel))
                return;
            if (message.Author == this.DiscordClient.CurrentUser)
                return;

            int argPos = 0;
            // Prefixes are ignored for DM channels
            if (!(message.Channel is IDMChannel))
            {
                // We get the guild configuration and determine if it's a command
                var guildConfig = message.Channel.GetGuildConfig(this);
                var commandPrefix = guildConfig.LibrarySettings.CommandPrefix;
                if (string.IsNullOrWhiteSpace(commandPrefix))
                {
                    if (!message.HasMentionPrefix(this.DiscordClient.CurrentUser, ref argPos))
                        return;
                }
                else if (!(message.HasStringPrefix(commandPrefix, ref argPos, StringComparison.InvariantCulture) || message.HasMentionPrefix(this.DiscordClient.CurrentUser, ref argPos)))
                    return;
            }

            // Execute the command
            var context = new CommandContext(this.DiscordClient, message);
            var result = await this.DiscordCommandService.ExecuteAsync(context, argPos, this.DiscordServices);
            string reply = null;
            if (!result.IsSuccess)
            {
                var localizer = context.Channel.GetLocalizer(this);
                try
                {
                    reply = localizer.Translate("Errors", result.Error.ToString(), context,
                        ("command", message.Content.Substring(argPos)), ("reason", result.ErrorReason));
                }
                catch (Exception)
                {
                    reply = localizer.Translate("Errors", "CommandError", context,
                        ("command", message.Content.Substring(argPos)), ("error", result.Error.ToString()), ("reason", result.ErrorReason));
                }
            }
            if (!string.IsNullOrWhiteSpace(reply))
                await context.Channel.SendMessageAsync(reply);
        }
    }
}
