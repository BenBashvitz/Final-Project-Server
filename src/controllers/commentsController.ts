import { Response } from "express";
import mongoose from "mongoose";
import z, { ZodError } from "zod";
import { USER_LOOKUP_PIPELINE_STAGE } from "../consts";
import commentModel from "../models/commentModel";
import { CommentBodySchema } from "../schemas/comment";
import Comment from "../types/comment";
import { AuthRequest } from "../types/request";
import BaseController from "./baseController";

class CommentsController extends BaseController<Comment> {
  constructor() {
    super(commentModel);
  }

  override async post(req: AuthRequest, res: Response) {
    try {
      const commentData = CommentBodySchema.parse(req.body);

      // const userId = req.user?._id;

      const currentUserId = new mongoose.Types.ObjectId(
        "69ac63d7aa7e528360e63264",
      );

      const instertedComment = await this.model.create({
        ...commentData,
        userId: currentUserId,
      });

      const [enrichedComment] = await this.model.aggregate<Comment>([
        { $match: { _id: instertedComment._id } },
        ...USER_LOOKUP_PIPELINE_STAGE,
        { $unset: ["userId"] },
      ]);

      return res.status(201).json(enrichedComment);
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
}

export default new CommentsController();
