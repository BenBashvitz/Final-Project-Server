import { Request, Response } from "express";
import mongoose from "mongoose";
import z, { ZodError } from "zod";
import config from "../configs/envVar";
import postModel from "../models/postModel";
import {
  GetAllPostsQueryParams,
  UpdatePostBody,
  PostParams,
} from "../schemas/post";
import { Post, PostPage, RawPost } from "../types/post";
import BaseController from "./baseController";
import { AuthRequest } from "../types/request";

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

  override async getAll(req: Request, res: Response) {
    try {
      const { cursor } = GetAllPostsQueryParams.parse(req.query);

      const currentUserId = new mongoose.Types.ObjectId(
        "69ac63d7aa7e528360e63264",
      );

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
    // const userId = req.user?._id;
    const userId = "69ac63d7aa7e528360e63264";

    req.body.userId = userId;

    const currentUserId = new mongoose.Types.ObjectId(userId);

    try {
      const inserted = await this.model.create(req.body);

      const [enrichedPost] = await this.model.aggregate<Post>([
        { $match: { _id: inserted._id } },
        ...this.getEnrichmentPipeline(currentUserId),
      ]);

      res.status(201).json(enrichedPost);
    } catch (error) {
      console.error(
        `An error occurred while creating the following post ${req.body}: `,
        error,
      );
      res
        .status(500)
        .send(
          `An error occurred while creating the following post: ${req.body}`,
        );
    }
  }

  override async put(req: AuthRequest, res: Response) {
    // const userId = req.user?._id;

    const { id } = PostParams.parse(req.params);
    const postUpdate = UpdatePostBody.parse(req.body);

    const userId = "69ac63d7aa7e528360e63264";

    req.body.userId = userId;

    const currentUserId = new mongoose.Types.ObjectId(userId);

    try {
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
      console.error(
        `An error occurred while updating the following post ${req.body}: `,
        error,
      );

      return res
        .status(500)
        .send(
          `An error occurred while updating the following post: ${req.body}`,
        );
    }
  }

  override async delete(req: AuthRequest, res: Response) {
    // const userId = req.user?._id;
    // const post = await postModel.findById(req.params.id);

    // if (post?.userId.toString() !== userId) {
    //   res.status(403).send("You are not authorized to delete this post");
    // }

    return super.delete(req, res);
  }
}

export default new PostController();
