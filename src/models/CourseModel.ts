import {HydratedDocument, Model, model, Query, Schema} from "mongoose";
import {
    CategoryChannel,
    ChannelType,
    Collection,
    Guild,
    OverwriteResolvable, PermissionsBitField, Role,
    TextChannel
} from "discord.js";
import {department} from "../config.json";
import {logger} from "../logger";

interface CourseInterface {
    courseName: string,
    timeCreated: Date,
    categoryId: string,
    homeworkId: string,
    announcementsId: string,
    resourcesId: string,
    generalId: string,
    generalRoleId: string,
    leaderRoleId: string,
    leaderId: string,
    links: string[],
}

type CourseModelType = Model<CourseInterface, CourseQueryHelpers, CourseMethods>;
type CourseModelQuery = Query<any, HydratedDocument<CourseInterface>, CourseQueryHelpers> & CourseQueryHelpers;

interface CourseMethods {
    getCategory(): CategoryChannel;

    getHomeworkChannel(): TextChannel;

    deleteCourse(): boolean;
}

interface CourseStaticMethods extends CourseModelType {
    createCourse(guild: Guild, number: number, reason: string): Promise<HydratedDocument<CourseInterface, CourseMethods>>
}

interface CourseQueryHelpers {
    byCourseName(this: CourseModelQuery, courseName: string): CourseModelQuery;

    byHomeworkId(this: CourseModelQuery, homeworkId: string): CourseModelQuery;
}

export const CourseSchema = new Schema<CourseInterface, CourseStaticMethods, CourseMethods, CourseQueryHelpers>({
    courseName: {
        type: String,
        required: true,
        unique: true,
        match: new RegExp(`^${department}`)
    },
    timeCreated: {type: Date, required: true},
    categoryId: {
        type: String,
        required: true,
        unique: true,
    },
    homeworkId: {
        type: String,
        required: true,
    },
    announcementsId: {
        type: String,
        required: true,
    },
    resourcesId: {
        type: String,
        required: true,
    },
    generalId: {
        type: String,
        required: true,
    },
    generalRoleId: {
        type: String,
        required: true
    },
    leaderRoleId: {
        type: String,
        required: true
    },
    leaderId: {
        type: String
    },
    links: {type: [String]}
});

CourseSchema.query.byCourseName = function (courseName: string): CourseModelQuery {
    return this.findOne({courseName: courseName}, ["categoryId", "generalRoleId", "leaderRoleId", "generalId", "leaderId"]);
};

CourseSchema.query.byHomeworkId = function (homeworkId: string): CourseModelQuery {
    return this.findOne({homeworkId: homeworkId}, ["categoryId", "homeworkId"]);
}

CourseSchema.static('createCourse', async function createCourse(guild: Guild, number: number, reason: string) {
    const course = `${department} ${number}`
    const cat = await CourseModel.find().byCourseName(course);

    if (cat === null) {
        const generalRole = await guild.roles.create({
            name: course,
        });

        const leaderRole = await guild.roles.create({
            name: `${course} Leader`,
            color: "Yellow",
        })


        const category: CategoryChannel = await guild.channels.create({
            name: course,
            type: ChannelType.GuildCategory,
            reason: reason,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: generalRole.id,
                    allow: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: leaderRole.id,
                    allow: [PermissionsBitField.Flags.ViewChannel]
                }
            ]
        });

        const createCourseChannel = async (name: string, permissionOverwrites?: OverwriteResolvable[] |
            Collection<string, OverwriteResolvable> | undefined) => {
            return await guild.channels.create({
                parent: category,
                name: `${department}-${number}-${name}`,
                type: ChannelType.GuildText,
                reason: reason,
                permissionOverwrites: permissionOverwrites ? permissionOverwrites : [],
            });
        };

        const courseChannels = {
            announcements: await createCourseChannel("announcements", [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: generalRole.id,
                    allow: [PermissionsBitField.Flags.ViewChannel],
                    deny: [PermissionsBitField.Flags.SendMessages]
                },
                {
                    id: leaderRole.id,
                    allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel]
                }
            ]),
            resources: await createCourseChannel("resources"),
            general: await createCourseChannel("general"),
            homework: await createCourseChannel("homework"),
        }

        await courseChannels.homework.setRateLimitPerUser(5);

        await courseChannels.general.send("This course needs a leader. If you think you are up to the challenge, then " +
            "type \`/course leader\`. More information about how to be an effective course leader will be sent to you " +
            "in the DMs!");

        const categoryDocument = new CourseModel({
            courseName: course,
            categoryId: category.id,
            homeworkId: courseChannels.homework.id,
            announcementsId: courseChannels.announcements.id,
            resourcesId: courseChannels.resources.id,
            generalId: courseChannels.general.id,
            generalRoleId: generalRole.id,
            leaderRoleId: leaderRole.id,
            timeCreated: new Date(),
            links: []
        });

        await categoryDocument.save();

        logger.info(`Created new course document with id: '${categoryDocument.id}'`);

        return category;
    } else {
        return null;
    }
})

CourseSchema.method("getCategory", async function getCategory(guild: Guild) {
    return await guild.channels.fetch(this.categoryId);
});

CourseSchema.method("getHomeworkChannel", async function getHomeworkChannel(guild: Guild) {
    return await guild.channels.fetch(this.homeworkId);
})

CourseSchema.method("deleteCourse", async function deleteCourse(guild: Guild, reason: string): Promise<boolean> {
    return guild.channels.fetch(this.categoryId)
        .then(async (category) => {
            if (category === null) return false;
            if (category instanceof CategoryChannel) {
                this.remove()
                category.children.cache.forEach((channel) => {
                    channel.delete(reason);
                });

                await category.delete(reason);

                const deleteRole = async (roleId: string) => {
                    const role = await guild.roles.fetch(roleId);
                    if (role === null) return;
                    await role.delete(reason);
                };

                await deleteRole(this.generalRoleId);
                await deleteRole(this.leaderRoleId);

                return true;
            } else {
                return false;
            }
        }).catch((e: Error) => {
            logger.error(`Cannot delete channel: ${this.categoryId} in ${guild.name}`)
            logger.error(e);
            return false;
        });
})

export const CourseModel = model<CourseInterface, CourseStaticMethods>("courses", CourseSchema);