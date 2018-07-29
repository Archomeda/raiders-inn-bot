using System;
using System.Threading.Tasks;
using Discord;
using Discord.Commands;
using DiscordBotLib.Extensions;
using DiscordBotLib.Localization;

namespace DiscordBotLib.Commands
{
    [Summary("Settings.Description")]
    public class SettingsModule : ModuleBase
    {
        [Group("activity")]
        [Summary("Settings.Activity.Description")]
        public class ActivityModule : ModuleBase
        {
            [Command]
            [Summary("Settings.Activity.Get.Description")]
            [RequireContext(ContextType.DM)]
            [RequireOwner]
            public Task Get()
            {
                var localizer = this.GetLocalizer();
                var client = this.Context.Client.GetBot().DiscordClient;
                if (client.Activity != null)
                    return this.ReplyAsync(localizer.Translate("Commands", "Settings.Activity.Get", this.Context, ("type", client.Activity.Type), ("name", client.Activity.Name)));
                return this.ReplyAsync(localizer.Translate("Commands", "Settings.Activity.Get.Empty", this.Context));
            }

            [Command("set")]
            [Summary("Settings.Activity.Set.Description")]
            [RequireContext(ContextType.DM)]
            [RequireOwner]
            public async Task Set(
                [Summary("Settings.Activity.Set.Type.Description")] string type,
                [Summary("Settings.Activity.Set.Text.Description"), Remainder] string text)
            {
                var localizer = this.GetLocalizer();
                if (!Enum.TryParse<ActivityType>(type, out var activity))
                {
                    await this.ReplyAsync(localizer.Translate("Commands", "Settings.Activity.Set.InvalidType", this.Context));
                    return;
                }
                var config = this.Context.GetGuildConfig().LibrarySettings;
                config.ActivityType = activity;
                config.ActivityText = text;
                await this.Context.Client.GetBot().DiscordClient.SetActivityAsync(new Game(text, activity));
                await this.ReplyAsync(localizer.Translate("Commands", "Settings.Activity.Set", this.Context, ("type", activity), ("name", text)));
            }

            [Command("unset")]
            [Summary("Settings.Activity.Unset.Description")]
            [RequireContext(ContextType.DM)]
            [RequireOwner]
            public async Task Unset()
            {
                var localizer = this.GetLocalizer();
                var config = this.Context.GetGuildConfig().LibrarySettings;
                config.ActivityText = null;
                await this.Context.Client.GetBot().DiscordClient.SetActivityAsync(new Game(null));
                await this.ReplyAsync(localizer.Translate("Commands", "Settings.Activity.Unset", this.Context));
            }
        }

        [Group("language")]
        [Summary("Settings.Language.Description")]
        public class LanguageModule : ModuleBase
        {
            [Command]
            [Summary("Settings.Language.GetGlobal.Description")]
            [RequireContext(ContextType.DM)]
            public Task GetGlobal()
            {
                var localizer = this.GetLocalizer();
                var langKey = localizer.Language;
                var langName = localizer.Translate("Locale", "Language");
                return this.ReplyAsync(localizer.Translate("Commands", "Settings.GetLanguageGlobal", this.Context, ("langKey", langKey), ("langName", langName)));
            }

            [Command]
            [Summary("Settings.Language.GetGuild.Description")]
            [RequireContext(ContextType.Guild)]
            public Task GetGuild()
            {
                var localizer = this.GetLocalizer();
                var langKey = localizer.Language;
                var langName = localizer.Translate("Locale", "Language");
                return this.ReplyAsync(localizer.Translate("Commands", "Settings.GetLanguageGuild", this.Context, ("langKey", langKey), ("langName", langName)));
            }

            [Command("set")]
            [Summary("Settings.Language.SetGlobal.Description")]
            [RequireContext(ContextType.DM)]
            [RequireOwner]
            public Task SetGlobal([Summary("Settings.Language.SetGlobal.LangId.Description")] string langId)
            {
                var localizer = new Localizer(langId);
                if (!localizer.Available)
                    return this.ReplyAsync(localizer.Translate("Commands", "Settings.SetLanguageGlobal.NotAvailable", this.Context, ("langKey", langId)));

                var config = this.Context.GetGuildConfig();
                config.LibrarySettings.Language = langId;

                localizer = this.GetLocalizer();
                var langName = localizer.Translate("Locale", "Language");
                return this.ReplyAsync(localizer.Translate("Commands", "Settings.SetLanguageGlobal", this.Context, ("langName", langName)));
            }

            [Command("set")]
            [Summary("Settings.Language.SetGuild.Description")]
            [RequireContext(ContextType.Guild)]
            [RequireUserPermission(GuildPermission.Administrator)]
            public Task SetGuild([Summary("Settings.Language.SetGuild.LangId.Description")] string langId)
            {
                var localizer = new Localizer(langId);
                if (!localizer.Available)
                    return this.ReplyAsync(localizer.Translate("Commands", "Settings.SetLanguageGuild.NotAvailable", this.Context, ("langKey", langId)));

                var config = this.Context.GetGuildConfig();
                config.LibrarySettings.Language = langId;

                localizer = this.GetLocalizer();
                var langName = localizer.Translate("Locale", "Language");
                return this.ReplyAsync(localizer.Translate("Commands", "Settings.SetLanguageGuild", this.Context, ("langName", langName)));
            }
        }

        [Group("prefix")]
        [Summary("Settings.Prefix.Description")]
        public class PrefixModule : ModuleBase
        {
            [Command]
            [Summary("Settings.Prefix.Get.Description")]
            [RequireContext(ContextType.Guild)]
            public Task Get()
            {
                var localizer = this.GetLocalizer();
                var config = this.Context.GetGuildConfig();
                var prefix = config.LibrarySettings.CommandPrefix;
                if (!string.IsNullOrWhiteSpace(prefix))
                    return this.ReplyAsync(localizer.Translate("Commands", "Settings.GetPrefix", this.Context, ("prefix", prefix)));
                return this.ReplyAsync(localizer.Translate("Commands", "Settings.GetPrefix.Empty", this.Context));
            }

            [Command("set")]
            [Summary("Settings.Prefix.Set.Description")]
            [RequireContext(ContextType.Guild)]
            [RequireUserPermission(GuildPermission.Administrator)]
            public Task Set([Summary("Settings.Prefix.Set.Prefix.Description")] string prefix)
            {
                var localizer = this.GetLocalizer();
                var config = this.Context.GetGuildConfig();
                config.LibrarySettings.CommandPrefix = prefix;
                if (!string.IsNullOrWhiteSpace(prefix))
                    return this.ReplyAsync(localizer.Translate("Commands", "Settings.SetPrefix", this.Context, ("prefix", prefix)));
                return this.ReplyAsync(localizer.Translate("Commands", "Settings.SetPrefix.Empty", this.Context));
            }
        }
    }
}
