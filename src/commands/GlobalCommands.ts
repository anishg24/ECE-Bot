import {Command} from "./Command";
import {Ping} from "./global/Ping";
import {User} from "./global/User";

export const GlobalCommands: Command[] = [
    Ping,
    User
];

export function getGlobalCommand(commandName: String): Command | undefined {
    return GlobalCommands.find((command: Command) => command.data.name === commandName);
}