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
        private const string EmbeddedConfigFileName = nameof(RaidersInnBot) + ".config.yml";
        private const string LocalConfigFolder = "config";
        private const string LocalConfigFileName = "global.yml";

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
                EmbeddedConfigFileName = EmbeddedConfigFileName,
                ConfigFolder = LocalConfigFolder,
                ConfigFileName = LocalConfigFileName
            }))
                return;

            Bot.BlockUntilExit();
#if DEBUG
            Console.WriteLine("Finished.");
            Console.ReadLine();
#endif
        }

        private static void Bot_Log(object sender, BotLogEventArgs e) =>
            Console.WriteLine(e.Message);
    }
}
