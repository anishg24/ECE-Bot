import {ChannelType, Message, TextChannel} from "discord.js";
import {Event} from "./Events";
import {logger} from "../logger";
import {CourseModel} from "../models/CourseModel";

export const MonitorHomeworkChannels: Event = {
    name: 'messageCreate',
    once: false,
    run: async (message: Message): Promise<void> => {
        if (message.author.bot || message.system) return;

        const guild = message.guild;
        if (guild === null) return;

        const channel = await CourseModel.find().byHomeworkId(message.channelId)
            .then(async (data) => {
                if (data !== null) {
                    return await data.getHomeworkChannel(guild);
                } else {
                    return null;
                }
            });

        if (channel === null || !(channel instanceof TextChannel)) return;

        channel.threads.create({
            name: "Question",
            reason: "Reason",
            startMessage: message,
        })
            .then(async () => {
                const deleteSoon = await message.reply({content: "I moved your question to a thread! Please use threads for questions" +
                        " as they don't take up as much space in a homework channel!"})

                setTimeout(() => deleteSoon.delete(), 5*1000);
            })
            .catch(logger.error);
    }
}