import {
    ChannelType,
    ChatInputCommandInteraction, GuildMember,
    SlashCommandBuilder, TextChannel,
} from "discord.js";
import {Command} from "../Command";
import {logger} from "../../logger";
import {department} from "../../config.json";
import {CourseModel} from "../../models/CourseModel";

export const Course: Command = {
    data: new SlashCommandBuilder()
        .setName("course")
        .setDescription("Various course commands for students!")
        .addSubcommand(subcommand => {
            return subcommand.setName("join")
                .setDescription("Join a course!")
                .addIntegerOption(option => {
                    return option.setName(department.toLowerCase())
                        .setDescription(`i.e. ${department} 45 (type just the number)`)
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(501)
                })
        })
        .addSubcommand(subcommand => {
            return subcommand.setName("leave")
                .setDescription("Leave a course!")
                .addIntegerOption(option => {
                    return option.setName(department.toLowerCase())
                        .setDescription(`i.e. ${department} 45 (type just the number)`)
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(501)
                })
        })
        .addSubcommand(subcommand => {
            return subcommand.setName("list")
                .setDescription(`List all ${department} courses offered this quarter!`)
        })
        .addSubcommand(subcommand => {
            return subcommand.setName("leader")
                .setDescription("Claim the leader role in a course!")
        })
    ,

    run: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        if (interaction.guild === null || !(interaction.member instanceof GuildMember)) return;

        const subcommand = interaction.options.getSubcommand();
        const courseNumber = interaction.options.getInteger(department.toLowerCase());

        if (subcommand === "join") {
            if (courseNumber === null) {
                await interaction.reply({content: "Please provide a course number!", ephemeral: true});
                return;
            }

            joinCourse(interaction.member, courseNumber)
                .then(async (isAdded) => {
                    if (isAdded) {
                        // TODO: Check if member is already part of course, or is this relevant?
                        await interaction.reply({
                            content: `Successfully joined ${department} ${courseNumber}!`,
                            ephemeral: true,
                        });
                    } else {
                        await interaction.reply({
                            content: `${department} ${courseNumber} isn't an existing course!`,
                            ephemeral: true,
                        });
                    }
                })
                .catch(async (err) => {
                    logger.error(err);
                    await interaction.reply({
                        content: "There was an error joining that course!",
                        ephemeral: true,
                    });
                });

        } else if (subcommand === "leave") {
            let c: number;
            if (courseNumber === null) {
                if (!interaction.inGuild() || interaction.channel === null ||
                    !(interaction.channel instanceof TextChannel)) return;
                const categoryId = interaction.channel.parentId;
                const query = await CourseModel.findOne({categoryId: categoryId}, "courseName")

                if (query === null) {
                    await interaction.reply({
                        content: "Please run this command in any of the course's channels or provide the course number!",
                        ephemeral: true,
                    });
                    return;
                }

                c = Number.parseInt(query.courseName.split(`${department} `)[1]);
            } else {
                c = courseNumber;
            }

            leaveCourse(interaction.member, c)
                .then(async (isRemoved) => {
                    if (isRemoved) {
                        await interaction.reply({
                            // TODO: Check if member is even part of the course. Or is that even relevant?
                            content: `You successfully left ${department} ${c}`,
                            ephemeral: true,
                        });
                    } else {
                        await interaction.reply({
                            content: `${department} ${c} isn't an existing course!`,
                            ephemeral: true,
                        });
                    }
                })
                .catch(async (err) => {
                    logger.error(err);
                    await interaction.reply({
                        content: "There was an error leaving that course!",
                        ephemeral: true
                    });
                })
        } else if (subcommand === "list") {
            await listCourses()
                .then(async (list) => {
                    await interaction.reply({
                        content: list,
                        ephemeral: true,
                    })
                })
                .catch(logger.error);
        } else if (subcommand === "leader") {
            if (!interaction.inGuild() || interaction.channel === null ||
                !(interaction.channel instanceof TextChannel)) return;

            const query = await CourseModel.findOne({generalId: interaction.channelId},
                ["generalRoleId", "leaderRoleId", "leaderId", "courseName"]
            );

            if (query === null) {
                await interaction.reply({
                    content: `Please claim leadership in the **general channel** of the course!`,
                    ephemeral: true,
                });
                return;
            } else if (query.leaderId === interaction.user.id) {
                await interaction.reply({
                    content: `You are already the leader for ${query.courseName}`
                });
                return;
            } else if (query.leaderId) {
                await interaction.reply({
                    content: "This course already has a leader!",
                    ephemeral: true,
                });
                return;
            } else if (!interaction.member.roles.cache.get(query.generalRoleId)) {
                await interaction.reply({
                    content: "How did you even get access to this channel? You have to join it to even see this!",
                })
                logger.warn(`${interaction.user.username} (${interaction.user.id}) tried to become a leader for ${query.courseName} when they haven't joined.`)
                return;
            }

            await CourseModel.findOneAndUpdate({generalId: interaction.channelId}, {leaderId: interaction.member.id});
            await interaction.member.roles.add(query.leaderRoleId);
            await interaction.reply(`You became the leader of ${query.courseName}!`);

        }
    }
}

async function joinCourse(user: GuildMember, courseNumber: number): Promise<boolean> {
    const course = `${department} ${courseNumber}`;

    const query = await CourseModel.find().byCourseName(course);

    if (query === null) {
        return false;
    }

    await user.roles.add(query.generalRoleId, `${user.displayName} joined ${course}`);
    return true;
}

async function leaveCourse(user: GuildMember, courseNumber: number): Promise<boolean> {
    const course = `${department} ${courseNumber}`;

    const query = await CourseModel.find().byCourseName(course);

    if (query === null) {
        return false;
    }

    await user.roles.remove([query.generalRoleId, query.leaderRoleId], `${user.displayName} left ${course}`);

    if (query.leaderId === user.id) {
        await CourseModel.findOneAndUpdate({courseName: course}, {leaderId: ""});
        await user.guild.channels.fetch(query.generalId)
            .then((channel) => {
                if (channel !== null && channel instanceof TextChannel) {
                    channel.send("The leader for this course has left the course. If you are interested in" +
                        " becoming the next course leader, type `/course leader` in this channel!");
                }
            });
    }
    return true;
}

async function listCourses(): Promise<string> {
    return await CourseModel.find()
        .then((queries) => {
            let result = "";
            queries.forEach((query) => {
                result += `- ${query.courseName}\n`;
            })
            return result;
        })
}