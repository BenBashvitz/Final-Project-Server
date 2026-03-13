import { Express } from "express";
import jwt from "jsonwebtoken";
import { Model } from "mongoose";
import request from "supertest";
import userModel from "../models/userModel";
import type { RawPost } from "../types/post";
import { TokenPayload, Tokens } from "../types/token";
import { UserInput } from "../types/user";
import { USERS } from "./consts";
import type { PostInput, PostInputWithUserId } from "./posts/types";

export const cleanupBeforeCommentTests = async (
  model: Model<Comment>,
  data: Omit<Comment, "userId" | "postId">[],
  userIds: string[],
  postIds: string[],
) => {
  await model.deleteMany();
  const commentsWithUserAndPost = data.map((comment, index) => ({
    ...comment,
    userId: userIds[index],
    postId: postIds[index],
  }));
  return model.create(commentsWithUserAndPost);
};

export const cleanupBeforePostTests = async (
  model: Model<RawPost>,
  data: PostInput[],
  userIds: string[],
) => {
  await model.deleteMany();

  const postsWithUserId: PostInputWithUserId[] = data.map((post, index) => ({
    ...post,
    userId: userIds[index],
  }));

  return model.create(postsWithUserId);
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
