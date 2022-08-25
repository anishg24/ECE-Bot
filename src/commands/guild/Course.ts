import {
    CategoryChannel,
    ChannelType,
    ChatInputCommandInteraction,
    Guild,
    PermissionOverwrites,
    SlashCommandBuilder,
} from "discord.js";
import {Command} from "../Command";
import {logger} from "../../logger";
import {department} from "../../config.json";
import {CourseModel} from "../../models/CourseModel";

export interface CourseCategory {
    baseName: string,
    permissionOverwrites: PermissionOverwrites[]
}

export const baseChannels: CourseCategory[] = [
    {
        baseName: "announcements",
        permissionOverwrites: []
    },
    {
        baseName: "resources",
        permissionOverwrites: []
    },
    {
        baseName: "general",
        permissionOverwrites: []
    },
    {
        baseName: "homework",
        permissionOverwrites: []
    },
]

export const Course: Command = {
    data: new SlashCommandBuilder()
        .setName("course")
        .setDescription("Manage the courses in the server")
        .addSubcommand(subcommand =>
            subcommand.setName("create")
                .setDescription("Create a new course")
                .addIntegerOption(option =>
                    option.setName("number")
                        .setDescription("Course number of the class to create")
                        .setRequired(true)
                        .setMinValue(5)
                        .setMaxValue(501)
                )
        ).addSubcommand(subcommand =>
            subcommand.setName("delete")
                .setDescription("Delete an existing course")
                .addIntegerOption(option =>
                    option.setName("number")
                        .setDescription("Course number of the class to delete")
                        .setRequired(true)
                        .setMinValue(5)
                        .setMaxValue(501)
                )
        ).addSubcommand(subcommand =>
            subcommand.setName("deleteall")
                .setDescription("Delete ALL courses")
        )
    ,
    run: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const courseNumber = interaction.options.getInteger("number");
        if (courseNumber === null) return;

        if (interaction.guild === null) return;
        const {user, guild} = interaction;

        const course = `${department} ${courseNumber}`;

        if (interaction.options.getSubcommand() === "create") {
            await interaction.deferReply();

            const reason = `${user.username} created an ${course}} course`;
            const category = await CourseModel.createCourse(interaction.guild, courseNumber, reason);

            if (category === null) {
                await interaction.editReply(`${course} already exists!`);
                return;
            }

            logger.info(`${user.username} created an '${course}' course with category id: '${category.id}' in ${guild.name}`);
            await interaction.editReply(`Successfully created ${course}!`);
        } else if (interaction.options.getSubcommand() === "delete") {
            await interaction.deferReply();

            const reason = `${user.username} deleted an ${course} course`;

            const category = await CourseModel.find().byCourseName(course);

            if (category === null) {
                await interaction.editReply(`${course} was not found!`);
                return;
            }


            category.deleteCourse(guild, category.categoryId, reason)
                .then(async (isDeleted: boolean) => {
                    if (isDeleted) {
                        logger.warn(`${user.username} deleted the '${course}' course in ${guild.name}`);
                        await interaction.editReply(`Successfully deleted ${course}!`);
                    } else {
                        await interaction.editReply(`There was an issue deleting ${course}`);
                    }
                });
        }
    }
}

// const createCourse = async (guild: Guild, courseNumber: number, reason: string): Promise<CategoryChannel | null> => {
//     const course = `${department} ${courseNumber}`
//     const cat = await CourseModel.findOne({"name": course}, "categoryId").exec();
//
//     if (cat === null) {
//         const category = await guild.channels.create({
//             name: course,
//             type: ChannelType.GuildCategory,
//             reason: reason
//         });
//
//         baseChannels.forEach((channel: CourseCategory) => {
//             guild.channels.create({
//                 parent: category,
//                 name: `${department}-${courseNumber}-${channel.baseName}`,
//                 type: ChannelType.GuildText,
//                 reason: reason,
//                 permissionOverwrites: channel.permissionOverwrites
//             });
//         });
//
//         const categoryDocument = new CourseModel({
//             name: course,
//             categoryId: category.id,
//             timeCreated: new Date(),
//             links: []
//         });
//
//         await categoryDocument.save();
//
//         logger.info(`Created new course document with id: '${categoryDocument.id}'`);
//
//         return category;
//     } else {
//         return null;
//     }
// }
//
// const deleteCourse = async (guild: Guild, categoryId: string, reason: string): Promise<boolean> => {
//     return guild.channels.fetch(categoryId)
//         .then((category) => {
//             if (category === null) return false;
//             if (category instanceof CategoryChannel) {
//                 category.children.cache.forEach((channel) => {
//                     channel.delete(reason);
//                 });
//                 category.delete(reason);
//                 return true;
//             } else {
//                 return false;
//             }
//         }).catch((e) => {
//             logger.error(`Cannot delete channel: ${categoryId} in ${guild.name}`)
//             logger.error(e);
//             return false;
//         });
// }