import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  DEFAULT_POSTS_PAGE_SIZE,
  INVALID_CURSOR_ERROR_MESSAGE,
} from "../consts";
import postModel from "../models/postModel";
import { Cursor, Post, PostFilters, PostPage, RawPost } from "../types/post";
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
      let pageSize = Number(process.env.POSTS_PAGE_SIZE);

      if (isNaN(pageSize) || pageSize <= 0) {
        pageSize = DEFAULT_POSTS_PAGE_SIZE;
      }

      const { cursor } = req.query as PostFilters;
      const currentUserId = new mongoose.Types.ObjectId(
        "69ac63d7aa7e528360e63264",
      );

      const parsedCursor: Cursor = cursor ? JSON.parse(cursor) : null;

      if (parsedCursor && (!parsedCursor.creationDate || !parsedCursor._id)) {
        return res.status(400).send(INVALID_CURSOR_ERROR_MESSAGE);
      }

      const posts = await this.model.aggregate<Post>([
        {
          $match: {
            ...(parsedCursor && {
              $or: [
                { creationDate: { $lt: new Date(parsedCursor.creationDate) } },
                {
                  creationDate: new Date(parsedCursor.creationDate),
                  _id: { $lt: new mongoose.Types.ObjectId(parsedCursor._id) },
                },
              ],
            }),
          },
        },
        { $sort: { creationDate: -1, _id: -1 } },
        { $limit: pageSize + 1 },
        ...this.getEnrichmentPipeline(currentUserId),
      ]);

      const hasNextPage = posts.length > pageSize;

      const id = posts[pageSize - 1]?._id;
      const creationDate = posts[pageSize - 1]?.creationDate;

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
      if (error instanceof SyntaxError) {
        return res.status(400).send(INVALID_CURSOR_ERROR_MESSAGE);
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

      console.log("enrichedPost: ", enrichedPost);

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
}

export default new PostController();
