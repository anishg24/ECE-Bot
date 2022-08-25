import {Routes, REST, RESTPostAPIApplicationCommandsJSONBody} from "discord.js";
import {token, client_id, guild_id} from "./config.json";
import {GuildCommands} from "./commands/GuildCommands";
import {Command} from "./commands/Command";
import {GlobalCommands} from "./commands/GlobalCommands";
import { logger } from "./logger";

// Delete all previously deployed commands...

const rest = new REST({version: '10'}).setToken(token);

rest.put(Routes.applicationGuildCommands(client_id, guild_id), { body: [] })
    .then(() => logger.info('Successfully deleted all guild commands.'))
    .catch(logger.error);

rest.put(Routes.applicationCommands(client_id), { body: [] })
    .then(() => logger.info('Successfully deleted all application commands.'))
    .catch(logger.error);

// Deploy Guild commands...

const guildCommands: RESTPostAPIApplicationCommandsJSONBody[] = GuildCommands
    .map((command: Command): RESTPostAPIApplicationCommandsJSONBody => command.data.toJSON());

rest.put(Routes.applicationGuildCommands(client_id, guild_id), {body: guildCommands})
    .then(() => logger.info("Successfully registered application guild commands!"))
    .catch(logger.error);

// Deploy Global commands...

const globalCommands: RESTPostAPIApplicationCommandsJSONBody[] = GlobalCommands
    .map((command: Command): RESTPostAPIApplicationCommandsJSONBody => command.data.toJSON());

rest.put(Routes.applicationCommands(client_id), {body: globalCommands})
    .then(() => logger.info("Successfully registered application global commands!"))
    .catch(logger.error);