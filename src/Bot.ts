import {ChatInputCommandInteraction, Client, Collection, GatewayIntentBits, Interaction} from 'discord.js';
import {mongo_uri, token} from './config.json';
import {getCommand} from "./commands/Command";
import {Event, Events} from "./events/Events";
import {logger} from "./logger";
import mongoose from "mongoose";

const client: Client = new Client({intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages
    ]});

mongoose.connect(mongo_uri)
    .then(() => logger.info("Connected to MongoDB"))
    .catch(err => logger.error(err));

for (const event of Events) {
    // TODO Remove the following ignore calls
    logger.info(`Adding listener to a ${event.name} event...`)
    if (event.once) {
        // @ts-ignore
        client.once(event.name, (...args) => event.run(...args));
    } else {
        // @ts-ignore
        client.on(event.name, (...args) => event.run(...args));
    }
}

// client.once('ready', (client: Client): void => {
//     console.log("Ready!");
// });
//
// client.on("interactionCreate", async (interaction: Interaction): Promise<void> => {
//     if (!interaction.isChatInputCommand()) return;
//
//     const command = getCommand(interaction.commandName);
//
//     if (!command) return;
//
//     try {
//         await command.run(interaction);
//     } catch (error) {
//         console.error(error);
//         await interaction.reply({content: "There was an error while executing this command!", ephemeral: true})
//     }
// });

client.login(token).then();

export default client;