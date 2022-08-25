import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    SlashCommandOptionsOnlyBuilder,
    SlashCommandSubcommandsOnlyBuilder
} from "discord.js";
import {getGuildCommand} from "./GuildCommands";
import {getGlobalCommand} from "./GlobalCommands";

export interface Command {
    data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder,
    run: (interaction: ChatInputCommandInteraction) => void
}

export function getCommand(commandName: String): Command | undefined {
    let command = getGuildCommand(commandName);

    if (command === undefined)
        command = getGlobalCommand(commandName);

    return command;

}