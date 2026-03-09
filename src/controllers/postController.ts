import { Request, Response } from "express";
import postModel from "../models/postModel";
import { Cursor, PostFilters, PostPage, RawPost } from "../types/post";
import BaseController from "./baseController";
import { DEFAULT_POSTS_PAGE_SIZE } from "../consts";

class PostController extends BaseController<RawPost> {
  constructor() {
    super(postModel);
  }

  override async getAll(req: Request, res: Response) {
    const pageSize = +(process.env.POSTS_PAGE_SIZE ?? DEFAULT_POSTS_PAGE_SIZE);
    const { cursor } = req.query as PostFilters;

    const parsedCursor = cursor ? JSON.parse(cursor) : null;

    try {
      const posts = await this.model
        .find({
          ...(parsedCursor && {
            $or: [
              { creationDate: { $lt: parsedCursor.creationDate } },
              {
                creationDate: parsedCursor.creationDate,
                _id: { $lte: parsedCursor._id },
              },
            ],
          }),
        })
        .sort({ creationDate: -1, _id: -1 })
        .limit(pageSize + 1);

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
