using System.Collections.Generic;
using Discord.Commands;

namespace DiscordBotLib.Extensions
{
    /// <summary>
    /// Module info extensions.
    /// </summary>
    public static class ModuleInfoExtensions
    {
        /// <summary>
        /// Finds a module by name recursively.
        /// </summary>
        /// <param name="module">The module.</param>
        /// <param name="name">The module name to find.</param>
        /// <returns>The module, or null if not found.</returns>
        public static ModuleInfo FindModule(this ModuleInfo module, string name)
        {
            if (module.Aliases.Count > 0 && module.Aliases[0] == name)
                return module;
            return module.Submodules.FindModule(name);
        }

        /// <summary>
        /// Finds a module by name recursively.
        /// </summary>
        /// <param name="modules">The modules.</param>
        /// <param name="name">The module name to find.</param>
        /// <returns>The module, or null if not found.</returns>
        public static ModuleInfo FindModule(this IEnumerable<ModuleInfo> modules, string name)
        {
            foreach (var module in modules)
            {
                var foundModule = module.FindModule(name);
                if (foundModule != null)
                    return foundModule;
            }
            return null;
        }
    }
}
