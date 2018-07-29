using System;
using System.Reflection;
using System.Threading.Tasks;
using Discord;
using Discord.WebSocket;
using DiscordBotLib;

namespace RaidersInnBot
{
    internal static class RaidersInnBot
    {
        private const string embeddedConfigFileName = nameof(RaidersInnBot) + ".config.yml";
        private const string localConfigFolder = "config";
        private const string localConfigFileName = "global.yml";

        internal static Bot Bot { get; private set; }

        private static async Task Main(string[] args)
        {
            Bot = new Bot(new DiscordSocketConfig
            {
                LogLevel = LogSeverity.Info,
                MessageCacheSize = 10
            });
            Bot.Log += Bot_Log;

            await Bot.InitializeCommands();
            if (!await Bot.Start<GuildConfig>(new BotSettings
            {
                Assembly = Assembly.GetExecutingAssembly(),
                EmbeddedConfigFileName = embeddedConfigFileName,
                ConfigFolder = localConfigFolder,
                ConfigFileName = localConfigFileName
            }))
                return;

            Bot.BlockUntilExit();
        }

        private static void Bot_Log(object sender, BotLogEventArgs e) =>
            Console.WriteLine(e.Message);
    }
}
