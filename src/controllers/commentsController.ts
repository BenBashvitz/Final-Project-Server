import { Request, Response } from "express";
import z, { ZodError } from "zod";
import { USER_LOOKUP_PIPELINE_STAGE } from "../consts";
import commentModel from "../models/commentModel";
import postModel from "../models/postModel";
import { CommentBodySchema } from "../schemas/comment";
import Comment from "../types/comment";
import { AuthRequest } from "../types/request";
import BaseController from "./baseController";
import { PostIdParamSchema } from "../schemas/common";

class CommentsController extends BaseController<Comment> {
  constructor() {
    super(commentModel);
  }

  override async post(req: AuthRequest, res: Response) {
    try {
      const commentData = CommentBodySchema.parse(req.body);
      const { postId } = PostIdParamSchema.parse(req.params);

      const userId = req.user?._id;

      const post = await postModel.findById(postId);

      if (!post) {
        return res.status(404).send(`The post was not found`);
      }

      const insertedComment = await this.model.create({
        ...commentData,
        userId,
        postId,
      });

      await postModel.findByIdAndUpdate(postId, {
        $inc: { commentCount: 1 },
      });

      const [enrichedComment] = await this.model.aggregate<Comment>([
        { $match: { _id: insertedComment._id } },
        ...USER_LOOKUP_PIPELINE_STAGE,
        { $unset: ["userId"] },
      ]);

      return res.status(201).json(enrichedComment);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).send(z.treeifyError(error));
      }

      console.error(`An error occurred while creating comment: `, error);

      return res.status(500).send(`An error occurred while creating comment`);
    }
  }

  override async getAll(req: Request, res: Response) {
    try {
      const { postId } = PostIdParamSchema.parse(req.params);

      const post = await postModel.findById(postId);

      if (!post) {
        return res.status(404).send(`Post not found`);
      }

      const comments = await this.model.aggregate<Comment>([
        { $match: { postId } },
        ...USER_LOOKUP_PIPELINE_STAGE,
        { $unset: ["userId"] },
      ]);

      return res.send(comments);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).send(z.treeifyError(error));
      }

      console.error(
        "An error occurred while getting comments for post: ",
        error,
      );

      return res
        .status(500)
        .send("An error occurred while getting comments for post");
    }
  }
}

export default new CommentsController();
