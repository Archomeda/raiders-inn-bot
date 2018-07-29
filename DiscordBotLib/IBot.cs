using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Reflection;
using System.Threading.Tasks;
using Discord.WebSocket;
using MongoDB.Driver;
using StackExchange.Redis;

namespace DiscordBotLib
{
    /// <summary>
    /// An interface for a Discord bot.
    /// </summary>
    public interface IBot
    {
        /// <summary>
        /// The Discord client.
        /// </summary>
        DiscordSocketClient DiscordClient { get; }

        /// <summary>
        /// The MongoDB client.
        /// </summary>
        MongoClient MongoClient { get; }

        /// <summary>
        /// The Redis client.
        /// </summary>
        ConnectionMultiplexer RedisClient { get; }

        /// <summary>
        /// Occurs on Discord bot logging.
        /// </summary>
        event EventHandler<BotLogEventArgs> Log;

        /// <summary>
        /// The global bot configuration.
        /// </summary>
        GlobalConfig GlobalConfig { get; }

        /// <summary>
        /// Gets the guild bot configuration.
        /// Guild id 0 is the default configuration.
        /// </summary>
        /// <param name="guildId">The guild id.</param>
        /// <returns>The guild configuration.</returns>
        GuildConfig GetGuildConfig(ulong guildId);

        /// <summary>
        /// Initializes all commands found in the current AppDomain.
        /// </summary>
        Task InitializeCommands();

        /// <summary>
        /// Initializes all commands in the given assembly.
        /// </summary>
        /// <param name="assembly">The assembly.</param>
        Task InitializeCommands(Assembly assembly);

        /// <summary>
        /// Starts the bot.
        /// </summary>
        /// <param name="botSettings">The bot settings.</param>
        Task<bool> Start<TConfig>(BotSettings botSettings) where TConfig : INotifyPropertyChanged, new();

        /// <summary>
        /// Logs a message.
        /// </summary>
        /// <param name="source">The log source.</param>
        /// <param name="message">The log message.</param>
        void LogMessage(string source, string message);
    }
}
