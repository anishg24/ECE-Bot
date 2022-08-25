import {ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import {Command} from "../Command";

export const Server: Command = {
    data: new SlashCommandBuilder()
        .setName("server")
        .setDescription("Replies with information about the server!"),
    run: async (interaction: ChatInputCommandInteraction) => {
        const {guild} = interaction;

        if (guild !== null) {
            await interaction.reply(`Server name: ${guild.name}\nTotal members: ${guild.memberCount}`);
        }

    }
}