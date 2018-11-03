using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Reflection;
using System.Resources;
using System.Text.RegularExpressions;
using Discord;
using Discord.Commands;

namespace DiscordBotLib.Localization
{
    /// <summary>
    /// A localizer.
    /// </summary>
    public class Localizer
    {
        private const string DefaultLangId = "en";

        private static readonly Dictionary<Assembly, LocalizationInfoAttribute> LocalizationInfos = new Dictionary<Assembly, LocalizationInfoAttribute>();
        private static readonly Dictionary<string, Formatter> Formatters = new Dictionary<string, Formatter>();

        /// <summary>
        /// Initializes a new instance of the <see cref="Localizer"/> class.
        /// </summary>
        /// <param name="language">The language.</param>
        public Localizer(string language)
        {
            this.Language = language;
            if (language != DefaultLangId)
            {
                string defaultLanguageKey = this.Translate("Locale", "LanguageKey");
                if (!Formatters.ContainsKey(language))
                    Formatters[language] = new Formatter(new CultureInfo(this.Language));
                this.Formatter = Formatters[language];
                this.Culture = this.Formatter.ParentFormatter as CultureInfo;
                string localizedLanguageKey = this.Translate("Locale", "LanguageKey");
                this.Available = defaultLanguageKey != localizedLanguageKey;
            }
            else
            {
                this.Culture = new CultureInfo(this.Language);
                this.Formatter = new Formatter(this.Culture);
                this.Available = true;
            }
        }

        /// <summary>
        /// The localizer language.
        /// </summary>
        public string Language { get; } = DefaultLangId;

        /// <summary>
        /// The localizer culture.
        /// </summary>
        public CultureInfo Culture { get; } = new CultureInfo(DefaultLangId);

        /// <summary>
        /// Gets the localizer formatter.
        /// </summary>
        public Formatter Formatter { get; }

        /// <summary>
        /// Checks whether the language is actually available.
        /// It does this by checking if the translation of the "LanguageKey" key is different from the default.
        /// </summary>
        public bool Available { get; }


        private string GetTranslationResource(string file, string key)
        {
            // Look into the bot instance assembly first, and then in our assembly as fallback
            string translation = null;
            foreach (var assembly in new[] { Assembly.GetEntryAssembly(), Assembly.GetExecutingAssembly() })
            {
                if (!LocalizationInfos.ContainsKey(assembly))
                    LocalizationInfos[assembly] = assembly.GetTypes().Select(t => t.GetCustomAttribute<LocalizationInfoAttribute>(false)).FirstOrDefault(t => t != null);
                if (LocalizationInfos[assembly] == null)
                    continue;

                var resourceManager = new ResourceManager($"{LocalizationInfos[assembly].BaseName}.{file}", assembly);
                try
                {
                    translation = resourceManager.GetString(key, this.Culture);
                    if (!string.IsNullOrWhiteSpace(translation))
                        break;
                }
                catch (Exception) { }
            }

            return translation;
        }


        /// <summary>
        /// Looks up a string from the locale definitions and returns the translation.
        /// </summary>
        /// <param name="file">The file.</param>
        /// <param name="key">The key.</param>
        /// <returns>The translation.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the key is not found in any resource files.</exception>
        public string Translate(string file, string key) =>
            this.Translate(file, key, (IDictionary<string, object>)null);

        /// <summary>
        /// Looks up a string from the locale definitions and returns the translation.
        /// </summary>
        /// <param name="file">The file.</param>
        /// <param name="key">The key.</param>
        /// <param name="args">Optional parameters that are replaced in the translation.</param>
        /// <returns>The translation.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the key is not found in any resource files.</exception>
        public string Translate(string file, string key, IDictionary<string, object> args)
        {
            // Get the translation
            string translation = this.GetTranslationResource(file, key);
            if (string.IsNullOrWhiteSpace(translation))
                throw new InvalidOperationException($"Key {key} was not found in any resource files.");

            if (args == null)
                return translation;

            // Change the named args to numeric args so that we can format everything in one go with String.Format
            int i = 0;
            foreach (var kvp in args)
            {
                translation = Regex.Replace(translation, $@"\{{{kvp.Key}(:[^\}}]*)?\}}", $"{{{i}$1}}");
                i++;
            }

            // Format
            return this.Format(translation, args.Values.ToArray());
        }

        /// <summary>
        /// Looks up a string from the locale definitions and returns the translation.
        /// </summary>
        /// <param name="file">The file.</param>
        /// <param name="key">The key.</param>
        /// <param name="args">Optional parameters that are replaced in the translation.</param>
        /// <returns>The translation.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the key is not found in any resource files.</exception>
        public string Translate(string file, string key, IEnumerable<KeyValuePair<string, object>> args)
        {
            if (args == null)
                return this.Translate(file, key);
            if (args is IDictionary<string, object> dict)
                return this.Translate(file, key, dict);
            return this.Translate(file, key, args.ToDictionary(p => p.Key, p => p.Value));
        }

        /// <summary>
        /// Looks up a string from the locale definitions and returns the translation.
        /// </summary>
        /// <param name="file">The file.</param>
        /// <param name="key">The key.</param>
        /// <param name="args">Optional parameters that are replaced in the translation.</param>
        /// <returns>The translation.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the key is not found in any resource files.</exception>
        public string Translate(string file, string key, params KeyValuePair<string, object>[] args) =>
            this.Translate(file, key, (IEnumerable<KeyValuePair<string, object>>)args);

        /// <summary>
        /// Looks up a string from the locale definitions and returns the translation.
        /// </summary>
        /// <param name="file">The file.</param>
        /// <param name="key">The key.</param>
        /// <param name="args">Optional parameters that are replaced in the translation.</param>
        /// <returns>The translation.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the key is not found in any resource files.</exception>
        public string Translate(string file, string key, IEnumerable<ValueTuple<string, object>> args) =>
            args == null ? this.Translate(file, key) : this.Translate(file, key, args.ToDictionary(p => p.Item1, p => p.Item2));

        /// <summary>
        /// Looks up a string from the locale definitions and returns the translation.
        /// </summary>
        /// <param name="file">The file.</param>
        /// <param name="key">The key.</param>
        /// <param name="args">Optional parameters that are replaced in the translation.</param>
        /// <returns>The translation.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the key is not found in any resource files.</exception>
        public string Translate(string file, string key, params ValueTuple<string, object>[] args) =>
            this.Translate(file, key, (IEnumerable<ValueTuple<string, object>>)args);

        /// <summary>
        /// Looks up a string from the locale definitions and returns the translation.
        /// </summary>
        /// <param name="file">The file.</param>
        /// <param name="key">The key.</param>
        /// <param name="commandContext">The command context.</param>
        /// <returns>The translation.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the key is not found in any resource files.</exception>
        public string Translate(string file, string key, ICommandContext commandContext) =>
            this.Translate(file, key, commandContext, (IDictionary<string, object>)null);

        /// <summary>
        /// Looks up a string from the locale definitions and returns the translation.
        /// </summary>
        /// <param name="file">The file.</param>
        /// <param name="key">The key.</param>
        /// <param name="commandContext">The command context.</param>
        /// <param name="args">Optional parameters that are replaced in the translation.</param>
        /// <returns>The translation.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the key is not found in any resource files.</exception>
        public string Translate(string file, string key, ICommandContext commandContext, IDictionary<string, object> args)
        {
            // Add the context
            var newArgs = args != null ? new Dictionary<string, object>(args) : new Dictionary<string, object>();
            newArgs.Add("user", commandContext.User);

            // If the message is in a DM context, append _dm to the language key if it exists
            if (commandContext.Channel is IDMChannel)
            {
                string translation = this.GetTranslationResource(file, $"{key}_dm");
                key = !string.IsNullOrWhiteSpace(translation) ? $"{key}_dm" : key;
            }

            return this.Translate(file, key, newArgs);
        }

        /// <summary>
        /// Looks up a string from the locale definitions and returns the translation.
        /// </summary>
        /// <param name="file">The file.</param>
        /// <param name="key">The key.</param>
        /// <param name="commandContext">The command context.</param>
        /// <param name="args">Optional parameters that are replaced in the translation.</param>
        /// <returns>The translation.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the key is not found in any resource files.</exception>
        public string Translate(string file, string key, ICommandContext commandContext, IEnumerable<KeyValuePair<string, object>> args)
        {
            if (args == null)
                return this.Translate(file, key, commandContext);
            else if (args is IDictionary<string, object> dict)
                return this.Translate(file, key, commandContext, dict);

            return this.Translate(file, key, commandContext, args.ToDictionary(p => p.Key, p => p.Value));
        }

        /// <summary>
        /// Looks up a string from the locale definitions and returns the translation.
        /// </summary>
        /// <param name="file">The file.</param>
        /// <param name="key">The key.</param>
        /// <param name="commandContext">The command context.</param>
        /// <param name="args">Optional parameters that are replaced in the translation.</param>
        /// <returns>The translation.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the key is not found in any resource files.</exception>
        public string Translate(string file, string key, ICommandContext commandContext, params KeyValuePair<string, object>[] args) =>
            this.Translate(file, key, commandContext, (IEnumerable<KeyValuePair<string, object>>)args);

        /// <summary>
        /// Looks up a string from the locale definitions and returns the translation.
        /// </summary>
        /// <param name="file">The file.</param>
        /// <param name="key">The key.</param>
        /// <param name="commandContext">The command context.</param>
        /// <param name="args">Optional parameters that are replaced in the translation.</param>
        /// <returns>The translation.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the key is not found in any resource files.</exception>
        public string Translate(string file, string key, ICommandContext commandContext, IEnumerable<ValueTuple<string, object>> args) =>
            args == null ? this.Translate(file, key, commandContext) : this.Translate(file, key, commandContext, args.ToDictionary(p => p.Item1, p => p.Item2));

        /// <summary>
        /// Looks up a string from the locale definitions and returns the translation.
        /// </summary>
        /// <param name="file">The file.</param>
        /// <param name="key">The key.</param>
        /// <param name="commandContext">The command context.</param>
        /// <param name="args">Optional parameters that are replaced in the translation.</param>
        /// <returns>The translation.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the key is not found in any resource files.</exception>
        public string Translate(string file, string key, ICommandContext commandContext, params ValueTuple<string, object>[] args) =>
            this.Translate(file, key, commandContext, (IEnumerable<ValueTuple<string, object>>)args);


        /// <summary>
        /// Replaces the format items in a specified string with the string representations
        /// of corresponding objects in a specified array.
        /// </summary>
        /// <param name="format">The format string.</param>
        /// <param name="args">An object array that contains zero or more objects to format.</param>
        /// <returns></returns>
        /// <exception cref="InvalidOperationException">Thrown when the key is not found in any resource files.</exception>
        public string Format(string format, params object[] args) =>
            string.Format(this.Formatter, format, args);
    }
}
