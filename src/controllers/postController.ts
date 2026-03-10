import { Request, Response } from "express";
import mongoose from "mongoose";
import { DEFAULT_POSTS_PAGE_SIZE } from "../consts";
import postModel from "../models/postModel";
import { Cursor, Post, PostFilters, PostPage, RawPost } from "../types/post";
import BaseController from "./baseController";

class PostController extends BaseController<RawPost> {
  constructor() {
    super(postModel);
  }

  override async getAll(req: Request, res: Response) {
    const pageSize = +(process.env.POSTS_PAGE_SIZE ?? DEFAULT_POSTS_PAGE_SIZE);

    const { cursor } = req.query as PostFilters;
    const currentUserId = new mongoose.Types.ObjectId(
      "69ac63d7aa7e528360e63264",
    );

    const parsedCursor = cursor ? JSON.parse(cursor) : null;

    try {
      const posts = await this.model.aggregate<Post>([
        {
          $match: {
            ...(parsedCursor && {
              $or: [
                { creationDate: { $lt: new Date(parsedCursor.creationDate) } },
                {
                  creationDate: new Date(parsedCursor.creationDate),
                  _id: { $lte: new mongoose.Types.ObjectId(parsedCursor._id) },
                },
              ],
            }),
          },
        },
        { $sort: { creationDate: -1, _id: -1 } },
        { $limit: pageSize + 1 },
        {
          $lookup: {
            from: "users",
            localField: "sender",
            foreignField: "_id",
            as: "sender",
            pipeline: [{ $project: { _id: 1, username: 1, imgUrl: 1 } }],
          },
        },
        { $unwind: "$sender" },
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
        { $unset: "_likedByCurrentUser" },
      ]);

      const nextCursor: Cursor = {
        _id: posts[pageSize]?._id ?? null,
        creationDate: posts[pageSize]?.creationDate ?? null,
      };

      if (posts.length > pageSize) {
        posts.pop();
      }

      const postPage: PostPage = {
        posts,
        nextCursor,
      };

      res.send(postPage);
    } catch (error) {
      console.error(
        `An error occurred while getting the post page ${cursor}: `,
        error,
      );
      res
        .status(500)
        .send("An error occurred while getting the current post page");
    }
  }
}

export default new PostController();
