import {
    ChannelType,
    ChatInputCommandInteraction,
    SlashCommandBuilder,
} from "discord.js";
import {Command} from "../Command";
import {logger} from "../../logger";
import {department} from "../../config.json";
import {CourseModel} from "../../models/CourseModel";

export const CourseAdmin: Command = {
    data: new SlashCommandBuilder()
        .setName("course-admin")
        .setDescription("Manage the courses in the server")
        .setDefaultMemberPermissions(0)
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
        ),
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


            category.deleteCourse(guild, reason)
                .then(async (isDeleted: boolean) => {
                    if (isDeleted) {
                        logger.warn(`${user.username} has deleted the '${course}' course in ${guild.name}`);
                        interaction.editReply(`Successfully deleted ${course}!`)
                            .catch((err) => {});
                    } else {
                        await interaction.editReply(`There was an issue deleting ${course}`);
                    }
                });
        }
    }
}