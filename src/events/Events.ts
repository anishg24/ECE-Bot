import {Client, GuildMember, Interaction} from "discord.js";
import {OnLogin} from "./OnLogin";
import {CommandListener} from "./CommandListener";
import {PromptUserOnJoin} from "./PromptUserOnJoin";

export interface Event {
    name: string,
    once: boolean,
    run:
        ((client: Client) => void) |
        ((interaction: Interaction) => Promise<void>) |
        ((member: GuildMember) => Promise<void>)
}

export const Events: Event[] = [
    OnLogin,
    CommandListener,
    PromptUserOnJoin,
];