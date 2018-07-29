using System;

namespace DiscordBotLib
{
    /// <summary>
    /// Event arguments for bot logging.
    /// </summary>
    /// <seealso cref="EventArgs" />
    public class BotLogEventArgs : EventArgs
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="BotLogEventArgs"/> class.
        /// </summary>
        /// <param name="message">The log message.</param>
        public BotLogEventArgs(string message)
        {
            this.Message = message;
        }

        /// <summary>
        /// The log message.
        /// </summary>
        public string Message { get; set; }
    }
}
