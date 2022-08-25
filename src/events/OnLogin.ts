import {Client} from "discord.js";
import { logger } from "../logger";
import {Event} from "./Events";

export const OnLogin: Event = {
    name: 'ready',
    once: true,
    run: (client: Client): void => {
        if (client.user === null) {
            logger.info("Ready! Not logged in as a user!");
        } else {
            logger.info(`Ready! Logged in as ${client.user.tag}`);
        }
    }
}