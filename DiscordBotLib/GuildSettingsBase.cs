using System.Collections.Generic;
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace DiscordBotLib
{
    /// <summary>
    /// An abstract class to ease the creation of guild settings.
    /// </summary>
    /// <seealso cref="INotifyPropertyChanged" />
    public abstract class GuildSettingsBase : INotifyPropertyChanged
    {
        /// <summary>
        /// Occurs when a property value changes.
        /// </summary>
        public event PropertyChangedEventHandler PropertyChanged;

        /// <summary>
        /// Called when a property is changed.
        /// Consider using <see cref="SetField{TField}(ref TField, TField, string)"/> for property setters.
        /// </summary>
        /// <param name="propertyName">The name of the property.</param>
        protected virtual void OnPropertyChanged(string propertyName) =>
            this.PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));

        /// <summary>
        /// Sets the backing field for the property and calls <see cref="PropertyChanged"/> if necessary.
        /// </summary>
        /// <typeparam name="TField">The type of the field.</typeparam>
        /// <param name="field">The field.</param>
        /// <param name="value">The value.</param>
        /// <param name="propertyName">The name of the property.</param>
        /// <returns>True if the new property was different and it has changed; false otherwise.</returns>
        protected bool SetField<TField>(ref TField field, TField value, [CallerMemberName] string propertyName = null)
        {
            if (EqualityComparer<TField>.Default.Equals(field, value))
                return false;
            field = value;
            this.OnPropertyChanged(propertyName);
            return true;
        }
    }
}
