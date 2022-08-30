import {Command} from "./Command";
import {Server} from "./guild/Server";
import {CourseAdmin} from "./guild/CourseAdmin";
import { Course } from "./guild/Course";

export const GuildCommands: Command[] = [
    Server,
    CourseAdmin,
    Course,
];

export function getGuildCommand(commandName: String): Command | undefined {
    return GuildCommands.find((command: Command) => command.data.name === commandName);
};