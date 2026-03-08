// import { Response } from "express";
import postModel from "../models/postModel";
import { RawPost } from "../types/post";
// import { AuthRequest } from "../types/request";
import BaseController from "./baseController";

class PostController extends BaseController<RawPost> {
  constructor() {
    super(postModel);
  }

  // override async post(req: AuthRequest, res: Response) {
  //   const userId = req.user?._id;

  //   req.body.sender = userId;

  //   return super.post(req, res);
  // }

  // override async put(req: AuthRequest, res: Response) {
  //   const userId = req.user?._id;

  //   const post = await postModel.findById(req.params.id);

  //   if (post && post.sender.toString() !== userId) {
  //     return res.status(403).send("You are not authorized to update this post");
  //   }

  //   return super.put(req, res);
  // }
}

export default new PostController();
