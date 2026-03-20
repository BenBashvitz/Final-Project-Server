import { Response } from "express";
import mongoose from "mongoose";
import z, { ZodError } from "zod";
import config from "../configs/envVar";
import postModel from "../models/postModel";
import {
  GetAllPostsQueryParamsSchema,
  PostIdParamsSchema,
  PostInputSchema,
  UpdatePostBodySchema,
} from "../schemas/post";
import { Post, PostPage, RawPost } from "../types/post";
import { AuthRequest } from "../types/request";
import BaseController from "./baseController";
import { removeFile } from "../utils/removeLocalFile";
import likeModel from "../models/likeModel";

class PostController extends BaseController<RawPost> {
  constructor() {
    super(postModel);
  }

  private getEnrichmentPipeline(currentUserId: mongoose.Types.ObjectId) {
    return [
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [{ $project: { _id: 1, username: 1, imgUrl: 1 } }],
        },
      },
      { $unwind: "$user" },
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
      const { cursor } = GetAllPostsQueryParamsSchema.parse(req.query);

      const currentUserId = new mongoose.Types.ObjectId(req.user?._id);

      const posts = await this.model.aggregate<Post>([
        {
          $match: {
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

      const [enrichedPost] = await this.model.aggregate<Post>([
        { $match: { _id: inserted._id } },
        ...this.getEnrichmentPipeline(currentUserId),
      ]);

      return res.status(201).json(enrichedPost);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).send(z.treeifyError(error));
      }

      console.error(
        `An error occurred while creating the following post ${req.body}: `,
        error,
      );

      return res
        .status(500)
        .send(
          `An error occurred while creating the following post: ${req.body}`,
        );
    }
  }

  override async put(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id;
      const { id } = PostIdParamsSchema.parse(req.params);

      const post = await this.model.findById(id);

      if (!post) {
        return res.status(404).send(`The post was not found`);
      }

      if (post.userId.toString() !== userId) {
        return res
          .status(403)
          .send("You are not authorized to update this post");
      }

      const currentUserId = new mongoose.Types.ObjectId(userId);
      const postUpdate = UpdatePostBodySchema.parse(req.body);

      const updatedData = await this.model.findByIdAndUpdate(id, postUpdate, {
        new: true,
        runValidators: true,
      });

      if (!updatedData) {
        return res.status(404).send(`The post was not found`);
      }

      const [enrichedPost] = await this.model.aggregate<Post>([
        { $match: { _id: updatedData._id } },
        ...this.getEnrichmentPipeline(currentUserId),
      ]);

      return res.status(200).json(enrichedPost);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).send(z.treeifyError(error));
      }

      console.error(
        `An error occurred while updating the following post ${req.body}: `,
        error,
      );

      return res.status(500).send(`An error occurred while updating the post`);
    }
  }

  override async delete(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id;
      const { id } = PostIdParamsSchema.parse(req.params);

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
        await removeFile(deletedData.imgUrl);
        await likeModel.deleteMany({ postId: deletedData._id });

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
}

export default new PostController();
