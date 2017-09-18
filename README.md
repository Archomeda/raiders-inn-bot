# Host-o-Tron - Discord Bot
A Discord bot that's powering the Raiders Inn Discord server.
While this bot is technically designed for this Discord server, you can adapt it for your own use as well.

## Features
The bot can do various tasks that helps the Guild Wars 2 raiding community on the Discord server.
 - **Guild Wars 2**
   - Raids
     - Command that assigns the raider status
     - Parses GW2Bot's LI and boss clear responses to assign the raid experienced role
   - Other
     - Parses chat codes automatically and includes the name and wiki link
     - Query the Guild Wars 2 wiki for something
 - **Utilities**
   - Rolling dice
   - Welcomes new people
 - **Administration**
   - Ability to export the list of role, channel and account ids to help configuring the bot (restricted by permissions by default)
 - **Moderation**
   - Keeps a certain amount of duplicated voice channels and removes unused ones (channel keeper)

### Available commands
You can type `!help` in any text channel to receive the list of available commands.
This message will get removed automatically after 5 minutes to prevent cluttering.
You can also type `!help <command>` - where `<command>` is the name of an available command - in order to receive more detailed information about a specific command.

## Usage
This bot is currently not publically available for invites. Instead, you have to run the bot for yourself.
There are two options: use Docker or set it up manually.
Do note that at this moment, this bot is not made to be ran on more than one Discord server simultaneously, and therefore hasn't been tested for that.
After installation, don't forget to edit the settings in the *config* folder (check *config/default.yml* for instructions).
The bot requires a reboot after every configuration change.

### Docker
 - Have [Docker](https://docs.docker.com/engine/installation/) and [Docker Compose](https://github.com/docker/compose/releases) installed
 - Clone or download the zip of a specific version (or master if that isn't available)
 - Run:
   
   ```bash
   cd kormir-discord-bot
   docker-compose build
   docker-compose up -d
   ```

You can manipulate the state of the bot by running various `docker-compose` commands.
These commands have to be executed from within the *kormir-discord-bot* folder:
 - Suspend: `docker-compose pause`
 - Resume: `docker-compose unpause`
 - Restart: `docker-compose restart`
 - Stop and remove: `docker-compose down`
 - Start: `docker-compose up -d`

### Manual (linux)
 - The bot requires the software to be installed:
   - Node.js 8
   - MongoDB 3.4
   - Redis 3.2 (optional, make sure to configure it in the options if installed)
 - Clone or download the zip of a specific version (or master if that isn't available)
 - Install the dependencies with your favorite package manager (e.g. `npm install`)
 - Run the bot (e.g. `npm start`, `./server.js` or `node server.js`)

If you are running the bot 24/7, it is recommended to have a process manager that monitors the bot's process (e.g. pm2 or systemd).

## Updating
This bot follows semantic versioning.
If a major version is released, it cannot be guaranteed that backwards compatibility is available.
Also, Docker images have to be created manually for now.

If you've used git, it's as easy as running `git pull` to update.
Check if your local config file needs any changes.
Afterwards, restart the bot if you've installed it manually.
If you've used Docker, instead run:
```bash
docker-compose down
docker-compose build
docker-compose up -d
```

## Contributing
You can always contribute, but it does not necessarily mean that every feature will be added.
Creating an issue explaining what kind of feature you want to add is probably better than wasting your time on a feature that might not be added. 

If you encounter a bug, please create an issue explaining with as much information as possible.
Other things like grammar and/or spelling errors are wanted as well.
