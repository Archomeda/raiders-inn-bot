# Host-o-Tron - Discord Bot
A Discord bot that's powering the Raiders Inn Discord server for Guild Wars 2.
While this bot is technically designed for this Discord server, you can adapt it for your own use as well.

The bot has been recently rewritten in .NET.
Make sure to check all the configurations before updating.

## Features
The bot can do various tasks that helps the Guild Wars 2 raiding community on the Discord server.
- None available at the moment

### Available commands
You can type `!help` in any text channel to receive the list of available commands.
You can also type `!help <command>` - where `<command>` is the name of an available command - in order to receive more detailed information about a specific command.

## Usage
This bot is currently not available for invites. Instead, you have to run the bot yourself.
There are two options: use Docker or set it up manually.
Do note that at this moment, this bot is not made to be run on more than one Discord server simultaneously, and therefore it hasn't been tested for that.

After installation, you run the bot once.
It will notify you about the global config file that has been created for you.
Change the settings, and restart the bot.
Note that the bot requires a reboot after every global configuration change.

### Docker Compose
 - Have [Docker](https://docs.docker.com/engine/installation/) and [Docker Compose](https://github.com/docker/compose/releases) installed
 - Create a new folder (e.g. *raiders-inn-bot*)
 - Run the following from within that folder:
   `wget -O - https://raw.githubusercontent.com/Archomeda/raiders-inn-bot/dotnet/install.sh | bash`
 - This will run [a script](install.sh) that sets up the environment for the bot to run in
 - Start the bot: `docker-compose up -d`

You can manipulate the state of the bot by running various `docker-compose` commands.
These commands have to be executed from within your chosen folder:
 - Suspend: `docker-compose pause`
 - Resume: `docker-compose unpause`
 - Restart: `docker-compose restart`
 - Stop and remove: `docker-compose down`
 - Start: `docker-compose up -d`

### Docker
 - Have [Docker](https://docs.docker.com/engine/installation/) installed
 - Start a [MongoDB](https://hub.docker.com/_/mongo/) (tested with 4.0) and [Redis](https://hub.docker.com/_/redis/) (tested with 4.0) image
 - Create a new folder (e.g. *raiders-inn-bot*)
 - Pull the Raiders Inn Bot image: `docker pull archomeda/raiders-inn-bot`
 - Create a bridge network between the MongoDB, Redis and Raiders Inn Bot containers
 - Start the bot: `docker-compose up -d`

### Manual
.NET binaries are not available.
You'll have to compile it yourself.
The bot uses .NET Core 2.1.
Additionally, the bot requires the following software to be installed:
 - MongoDB (tested with 4.0)
 - Redis (tested with 4.0)

You can start the bot with `dotnet RaidersInnBot.dll`.
If you are running the bot 24/7, it is recommended to have a process manager that monitors the bot's process (e.g. pm2 or systemd).

## Updating
### Docker
Run the following from within the bot folder:
```bash
docker-compose pull
docker-compose down
docker-compose up -d
```

### Manual
Follow the manual installation instructions.

## Contributing
You can always contribute, but it does not necessarily mean that every feature will be added.
Creating an issue explaining what kind of feature you want to add is probably better than wasting your time on a feature that might not be added. 

If you encounter a bug, please create an issue explaining with as much information as possible.
Other things like grammar and/or spelling errors are wanted as well.
