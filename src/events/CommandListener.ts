import {Interaction} from "discord.js";
import {getCommand} from "../commands/Command";
import {Event} from "./Events";
import {logger} from "../logger";

export const CommandListener: Event = {
    name: 'interactionCreate',
    once: false,
    run: async (interaction: Interaction): Promise<void> => {
        if (!interaction.isChatInputCommand()) return;

        const command = getCommand(interaction.commandName);

        if (!command) return;

        try {
            await command.run(interaction);
        } catch (error) {
            logger.error(error);
            await interaction.reply({content: "There was an error while executing this command!", ephemeral: true})
        }
    }
}