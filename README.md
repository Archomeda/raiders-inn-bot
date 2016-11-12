# The Raiders Inn Discord Bot
The Raiders Inn is a Discord server specifically for Guild Wars 2 raiders to help find each other.
This bot helps with various tasks on the server.

## Features
The bot can do various tasks that helps the Guild Wars 2 raiding community on The Raiders Inn Discord server.
At the moment, it supports:

 - Welcoming new people with a command, in which the bot will redirect them to a specific channel for rules and information.
 - Providing commands to allow people assigning themselves to EU, NA and/or CN (this uses Discord roles). 
 - Providing the weekly raid rewards reset time, including a countdown and common timezones.
 - Allowing people to create temporary raid squads that are invite-only.
 - Miscellaneous stuff like:
   - Querying the wiki for something
   - Rolling a dice
   - Exporting a list of role, channel and account ids to help configuring the bot *(restricted by permissions by default)*

### Available commands
You can type `!help` in any text channel to receive a DM containing the list of available commands.
You can also type `!help <command>` - where `<command>` is the name of an available command - in order to receive more detailed information about a specific command.

## Usage
If you want to run the bot yourself, there are a few things you will have to do:

 - The bot requires you to have at least Node.js v6 installed.
 - Clone or download the zip on the master branch.
 - Install the dependencies with your favorite package manager (e.g. `npm install`).
 - Run the bot (e.g. `npm start`, `./server.js` or `node server.js`).

If you are running the bot 24/7, it is recommended to have a process manager that monitors the bot's process (e.g. pm2 or systemd).

### Updating
The bot doesn't use a versioning scheme at the moment.
This means that every time you want to update, you'll have to check if there are incompatibilities in the config file.
This can be done easily by comparing the file *config/default.yml*.

If you've used git, it's as easy as running `git pull` to update.
Check if your local config file needs any changes.
Restart the bot afterwards.

## Contributing
You can always contribute, but it does not necessarily mean that every feature will be added.
Creating an issue explaining what kind of feature you want to add is probably better than wasting your time on a feature that might not be added. 
The current scope of the bot includes:

 - Provide information about Guild Wars 2 raiding.
 - Help people finding each other and to group up.
 - Provide other related things to Guild Wars 2 or Guild Wars 2 raiding.

If you create a pull request, please do so on the `develop` branch and not on `master`.

If you encounter a bug, please create an issue explaining with as much information as possible.
Other things like grammar and/or spelling errors are wanted as well.
