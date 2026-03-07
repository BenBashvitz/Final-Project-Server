import { Express } from "express";
import { Model } from "mongoose";
import request from "supertest";
import userModel from "../models/userModel";
import { Tokens, TokenPayload } from "../types/token";
import { USERS } from "./consts";
import jwt from "jsonwebtoken";
import { UserInput } from "../types/user";
import { Post, PostInput } from "../types/post";

export const cleanupBeforeCommentTests = async (
  model: Model<Comment>,
  data: Omit<Comment, "sender" | "postId">[],
  userIds: string[],
  postIds: string[],
) => {
  await model.deleteMany();
  const commentsWithUserAndPost = data.map((comment, index) => ({
    ...comment,
    sender: userIds[index],
    postId: postIds[index],
  }));
  return model.create(commentsWithUserAndPost);
};

export const cleanupBeforePostTests = async (
  model: Model<Post>,
  data: PostInput[],
  userIds: string[],
) => {
  await model.deleteMany();

  const postsWithSender = data.map((post, index) => ({
    ...post,
    sender: userIds[index],
  }));

  return model.create(postsWithSender);
};

export const setupMultipleUsersForTests = async (app: Express) => {
  await userModel.deleteMany();

  const userTokens: Tokens[] = await Promise.all(
    USERS.map((user) => getUserToken(app, user)),
  );
  const userIds: string[] = userTokens.map(
    (token) => (jwt.decode(token.token) as TokenPayload).userId,
  );

  return { userTokens, userIds };
};

export const getUserToken = async (
  app: Express,
  user: UserInput,
): Promise<Tokens> => {
  const response = await request(app).post("/auth/register").send(user);

  return response.body;
};
