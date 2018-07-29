using System;
using System.Diagnostics;

namespace DiscordBotLib.Utils
{
    /// <summary>
    /// Ensures additions.
    /// </summary>
    public static class Ensure
    {
        /// <summary>
        /// Checks if the given argument is null, and throws <see cref="ArgumentNullException"/> if it's true.
        /// </summary>
        /// <param name="argument">The argument.</param>
        /// <param name="argumentName">The name of the argument.</param>
        /// <exception cref="ArgumentNullException">Thrown whenever the given argument is null.</exception>
        [DebuggerStepThrough]
        public static void ArgumentNotNull(object argument, string argumentName)
        {
            if (argument == null)
                throw new ArgumentNullException(argumentName);
        }
    }
}
