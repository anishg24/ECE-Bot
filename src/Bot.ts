import {Client, GatewayIntentBits} from 'discord.js';
import {mongo_uri, token} from './config.json';
import {Events} from "./events/Events";
import {logger} from "./logger";
import mongoose from "mongoose";

const client: Client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages
    ]
});

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

client.login(token).then();

export default client;