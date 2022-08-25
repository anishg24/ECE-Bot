import {DMChannel, GuildMember, MessagePayload} from "discord.js";
import {Event} from "./Events";
import {logger} from "../logger";

export const PromptUserOnJoin: Event = {
    name: "guildMemberAdd",
    once: false,
    run: async (member: GuildMember): Promise<void> => {

        const dm: DMChannel = await member.createDM();

        await member.send(
            new MessagePayload(
                dm,
                {
                    content: "Hello There! Welcome to the ECE discord!"
                }
            )
        )
            .then(() => logger.info(`${member.user.username} joined the server`))
            .catch(logger.error);
    }
}