import { Request, Response } from "express";
import mongoose from "mongoose";
import z, { ZodError } from "zod";
import config from "../config";
import postModel from "../models/postModel";
import { GetAllPostsQueryParams } from "../schemas/post";
import { Post, PostPage, RawPost } from "../types/post";
import BaseController from "./baseController";

class PostController extends BaseController<RawPost> {
  constructor() {
    super(postModel);
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
        .send("An error occurred while getting the current post page");
    }
  }
}

export default new PostController();
