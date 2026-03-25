import { Response } from "express";
import mongoose from "mongoose";
import z, { ZodError } from "zod";
import likeModel from "../models/likeModel";
import postModel from "../models/postModel";
import { PostIdParamSchema } from "../schemas/common";
import { AuthRequest, ResponseErrorMessage } from "../types/request";
import { MongoServerError } from "mongodb";

const likePost = async (postId: mongoose.Types.ObjectId, like: boolean) =>
  (
    await postModel.findByIdAndUpdate(
      postId,
      {
        $inc: { likeCount: like ? 1 : -1 },
      },
      { new: true, projection: { _id: 1, likeCount: 1 }, runValidators: true },
    )
  )?.toObject() ?? null;

const like = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = PostIdParamSchema.parse(req.params);
    const userId = req.user?._id;

    const post = await postModel.findById(postId);

    if (!post) {
      return res.status(404).send(`The post was not found`);
    }

    await likeModel.create({ postId, userId });

    const likeUpdate = await likePost(postId, true);

    if (!likeUpdate) {
      return res.status(404).send(`The post was not found`);
    }

    res.status(200).send({ ...likeUpdate, isLikedByCurrentUser: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).send(z.treeifyError(error));
    }

    const dupKeyErrorCode = 11000;

    if (error instanceof MongoServerError && error.code === dupKeyErrorCode) {
      return res
        .status(409)
        .send(ResponseErrorMessage.POST_IS_ALREADY_LIKED_BY_USER);
    }

    console.error(`An error occurred while adding like to the post: `, error);

    return res
      .status(500)
      .send(`An error occurred while adding like to the post`);
  }
};

const unlike = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = PostIdParamSchema.parse(req.params);
    const userId = req.user?._id;

    const response = await likeModel.deleteOne({ postId, userId });

    if (response.deletedCount === 0) {
      return res
        .status(404)
        .send(`There was no like found for this post and user`);
    }

    const likeUpdate = await likePost(postId, false);

    if (!likeUpdate) {
      return res.status(404).send(`The post was not found`);
    }

    res.status(200).send({ ...likeUpdate, isLikedByCurrentUser: false });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).send(z.treeifyError(error));
    }

    console.error(`An error occurred while doing unlike to the post: `, error);

    return res
      .status(500)
      .send(`An error occurred while doing unlike to the post`);
  }
};

export default {
  like,
  unlike,
};
