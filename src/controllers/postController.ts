import { Response } from "express";
import mongoose from "mongoose";
import z, { ZodError } from "zod";
import config from "../configs/envVar";
import { USER_LOOKUP_PIPELINE_STAGE } from "../consts";
import likeModel from "../models/likeModel";
import postModel from "../models/postModel";
import { IdParamSchema } from "../schemas/common";
import {
    GetAllPostsQueryParamsSchema,
    GetRelevantPostsByQuerySchema,
    PostInputSchema,
    UpdatePostBodySchema,
} from "../schemas/post";
import { Post, PostPage, RawPost } from "../types/post";
import { AuthRequest } from "../types/request";
import { removeFile } from "../utils/removeLocalFile";
import BaseController from "./baseController";
import ragChunkService from "../services/ragChunkService";
import aiService from "../services/aiService";

class PostController extends BaseController<RawPost> {
    constructor() {
        super(postModel);
    }

    private getEnrichmentPipeline(currentUserId: mongoose.Types.ObjectId) {
        return [
            ...USER_LOOKUP_PIPELINE_STAGE,
            {
                $lookup: {
                    from: "likes",
                    let: { postId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$postId", "$$postId"] },
                                        { $eq: ["$userId", currentUserId] },
                                    ],
                                },
                            },
                        },
                        { $limit: 1 },
                    ],
                    as: "_likedByCurrentUser",
                },
            },
            {
                $addFields: {
                    isLikedByCurrentUser: {
                        $gt: [{ $size: "$_likedByCurrentUser" }, 0],
                    },
                },
            },
            { $unset: ["_likedByCurrentUser", "userId"] },
        ];
    }

    override async getAll(req: AuthRequest, res: Response) {
        try {
            const { cursor, userId } = GetAllPostsQueryParamsSchema.parse(req.query);

            const currentUserId = new mongoose.Types.ObjectId(req.user?._id);

            const posts = await this.model.aggregate<Post>([
                {
                    $match: {
                        ...(userId && { userId }),
                        ...(cursor && {
                            $or: [
                                { creationDate: { $lt: cursor.creationDate } },
                                {
                                    creationDate: cursor.creationDate,
                                    _id: { $lt: cursor._id },
                                },
                            ],
                        }),
                    },
                },
                { $sort: { creationDate: -1, _id: -1 } },
                { $limit: config.POSTS_PAGE_SIZE + 1 },
                ...this.getEnrichmentPipeline(currentUserId),
            ]);

            const hasNextPage = posts.length > config.POSTS_PAGE_SIZE;

            const id = posts[config.POSTS_PAGE_SIZE - 1]?._id;
            const creationDate = posts[config.POSTS_PAGE_SIZE - 1]?.creationDate;

            const newCursor: PostPage["cursor"] =
                id && creationDate && hasNextPage
                    ? {
                        _id: id,
                        creationDate,
                    }
                    : null;

            if (hasNextPage) {
                posts.pop();
            }

            const postPage: PostPage = {
                posts,
                cursor: newCursor,
            };

            return res.send(postPage);
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).send(z.treeifyError(error));
            }

            console.error(
                `An error occurred while getting the current post page: `,
                error,
            );

            return res
                .status(500)
                .send(`An error occurred while getting the current post page`);
        }
    }

    override async post(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?._id;
            const postInput = PostInputSchema.parse(req.body);

            const currentUserId = new mongoose.Types.ObjectId(userId);

            const inserted = await this.model.create({
                ...postInput,
                userId: currentUserId,
            });

            await ragChunkService.saveRagChunksForPost(inserted.toObject())

            const [enrichedPost] = await this.model.aggregate<Post>([
                { $match: { _id: inserted._id } },
                ...this.getEnrichmentPipeline(currentUserId),
            ]);


            return res.status(201).json(enrichedPost);
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).send(z.treeifyError(error));
            }

            console.error(`An error occurred while creating the post: `, error);

            return res.status(500).send(`An error occurred while creating the post`);
        }
    }

    override async put(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?._id;
            const { id } = IdParamSchema.parse(req.params);

            const post = await this.model.findById(id);

            if (!post) {
                return res.status(404).send(`The post was not found`);
            }

            if (post.userId.toString() !== userId) {
                return res
                    .status(403)
                    .send("You are not authorized to update this post");
            }

            const postUpdate = UpdatePostBodySchema.parse(req.body);

            const updatedData = await this.model.findByIdAndUpdate(id, postUpdate, {
                new: true,
                runValidators: true,
                projection: { _id: 1, description: 1, imgUrl: 1 },
            });

            if (!updatedData) {
                return res.status(404).send(`The post was not found`);
            }

            await ragChunkService.updateRagChunksForPost(updatedData.toObject())

            return res.status(200).json(updatedData);
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).send(z.treeifyError(error));
            }

            console.error(`An error occurred while updating the post: `, error);

            return res.status(500).send(`An error occurred while updating the post`);
        }
    }

    override async delete(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?._id;
            const { id } = IdParamSchema.parse(req.params);

            const post = await this.model.findById(id);

            if (!post) {
                return res.status(404).send(`The post was not found`);
            }

            if (post.userId.toString() !== userId) {
                return res
                    .status(403)
                    .send("You are not authorized to delete this post");
            }

            const deletedData: Pick<Post, "_id" | "imgUrl"> | null =
                await this.model.findOneAndDelete(
                    {
                        _id: id,
                    },
                    { projection: { _id: 1, imgUrl: 1 } },
                );

            if (deletedData) {
                await removeFile(deletedData.imgUrl).catch((error) => {
                    console.error(
                        `An error occurred while deleting the post image file: `,
                        error,
                    );
                });
                await likeModel.deleteMany({ postId: deletedData._id });
                await ragChunkService.deleteRagChunksForPost(deletedData._id);

                res.status(200).json({ _id: deletedData._id });
            } else {
                res.status(404).send(`The post was not found`);
            }
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).send(z.treeifyError(error));
            }

            console.error(`An error occurred while deleting post`, error);
            res.status(500).send(`An error occurred while deleting post`);
        }
    }

    async getRelevantPosts(req: AuthRequest, res: Response) {
        try {
            const { query } = GetRelevantPostsByQuerySchema.parse(req.query);
            const currentUserId = new mongoose.Types.ObjectId(req.user?._id);

            const relevantRawPosts = await aiService.getRelevantPosts(query);
            const postIds = relevantRawPosts.map(post => post._id);

            const enrichedPosts = await this.model.aggregate<Post>([
                {
                    $match: {
                        _id: { $in: postIds },
                    },
                },
                {
                    $addFields: {
                        __order: { $indexOfArray: [postIds, "$_id"] },
                    },
                },
                { $sort: { __order: 1 } },
                ...this.getEnrichmentPipeline(currentUserId),
            ]);

            res.status(200).json(enrichedPosts);
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).send(z.treeifyError(error));
            }

            console.error(`An error occurred while fetching relevant posts`, error);
            res.status(500).send(`An error occurred while fetching relevant posts`);
        }
    }
}

export default new PostController();
