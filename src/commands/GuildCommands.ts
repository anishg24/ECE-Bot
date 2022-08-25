import {Command} from "./Command";
import {Server} from "./guild/Server";
import {Course} from "./guild/Course";

export const GuildCommands: Command[] = [
    Server,
    Course
];

export function getGuildCommand(commandName: String): Command | undefined {
    return GuildCommands.find((command: Command) => command.data.name === commandName);
};