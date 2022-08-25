import {ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import {Command} from "../Command";

export const User: Command = {
    data: new SlashCommandBuilder()
        .setName("user")
        .setDescription("Replies with information about the user!"),
    run: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const {user} = interaction;
        await interaction.reply(`Your tag: ${user.tag}\nYour id: ${user.id}`);
    }
}