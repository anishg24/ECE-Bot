import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    SlashCommandBuilder
} from "discord.js";
import {Command} from "../Command";

export const Ping: Command = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Replies with Pong!"),
    run: async (interaction: ChatInputCommandInteraction): Promise<void> => {

        const row: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('primary')
                    .setLabel('primary')
                    .setStyle(ButtonStyle.Primary),
            );

        await interaction.reply({content: "Pong!", components: [row]});
    }
}