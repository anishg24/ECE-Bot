// noinspection JSDeprecatedSymbols

import {HydratedDocument, Model, model, Query, Schema} from "mongoose";
import {CategoryChannel, ChannelType, Guild, GuildChannel, NonThreadGuildBasedChannel} from "discord.js";
import {department} from "../config.json";
import {logger} from "../logger";
import {baseChannels, CourseCategory } from "../commands/guild/Course";

interface CourseInterface {
    courseName: string,
    timeCreated: Date,
    categoryId: string,
    links: string[],
}

type CourseModelType = Model<CourseInterface, CourseQueryHelpers, CourseMethods>;
type CourseModelQuery = Query<any, HydratedDocument<CourseInterface>, CourseQueryHelpers> & CourseQueryHelpers;

interface CourseMethods {
    getCategory(): CategoryChannel;
    deleteCourse(): boolean;
}

interface CourseStaticMethods extends CourseModelType {
    createCourse(guild: Guild, number: number, reason: string): Promise<HydratedDocument<CourseInterface, CourseMethods>>
}

interface CourseQueryHelpers {
    byCourseName(this: CourseModelQuery, courseName: string): CourseModelQuery;
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
    links: {type: [String]}
});

CourseSchema.query.byCourseName = function(courseName: string): CourseModelQuery {
    return this.findOne({courseName: courseName}, "categoryId");
};

CourseSchema.static('createCourse', async function createCourse(guild: Guild, number: number, reason: string) {
    const course = `${department} ${number}`
    const cat = await CourseModel.find().byCourseName(course);

    if (cat === null) {
        const category = await guild.channels.create({
            name: course,
            type: ChannelType.GuildCategory,
            reason: reason
        });

        baseChannels.forEach((channel: CourseCategory) => {
            guild.channels.create({
                parent: category,
                name: `${department}-${number}-${channel.baseName}`,
                type: ChannelType.GuildText,
                reason: reason,
                permissionOverwrites: channel.permissionOverwrites
            });
        });

        const categoryDocument = new CourseModel({
            courseName: course,
            categoryId: category.id,
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

CourseSchema.method("deleteCourse", async function deleteCourse(guild: Guild, reason: string): Promise<boolean> {
    return guild.channels.fetch(this.categoryId)
        .then((category) => {
            if (category === null) return false;
            if (category instanceof CategoryChannel) {
                this.remove()
                category.children.cache.forEach((channel) => {
                    channel.delete(reason);
                });
                category.delete(reason);
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