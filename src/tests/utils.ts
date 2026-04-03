import { Express } from "express";
import jwt from "jsonwebtoken";
import request, { Response } from "supertest";
import { accessTokenCookieName, refreshTokenCookieName } from "../consts";
import userModel from "../models/userModel";
import type { TokenPayload, Tokens } from "../types/token";
import type { UserInput } from "../types/user";
import { POSTS, USERS } from "./consts";
import postModel from "../models/postModel";
import type { PostInputWithUserId } from "./types";

type UserIdsAndToken = { userTokens: Tokens[]; userIds: string[] };

export const setupMultipleUsersForTests = async (
  app: Express,
): Promise<UserIdsAndToken> => {
  await userModel.deleteMany();

  const userTokens: Tokens[] = await Promise.all(
    USERS.map((user) => getUserToken(app, user)),
  );
  const userIds: string[] = userTokens.map(
    (tokens) => (jwt.decode(tokens.accessToken) as TokenPayload).userId,
  );

  return { userTokens, userIds };
};

export const setupDifferentUsersPosts = async (userIds: string[]) => {
  const postsToInsert: PostInputWithUserId[] = POSTS.map((post, index) => ({
    ...post,
    userId: userIds[index],
  }));

  const createdPosts = await postModel.create(postsToInsert);

  return createdPosts[0].toObject()._id.toString();
};

export const setupSameUserPosts = async (userId: string) => {
  const postsToInsert: PostInputWithUserId[] = POSTS.map((post) => ({
    ...post,
    userId,
  }));

  const createdPosts = await postModel.create(postsToInsert);

  return createdPosts;
};

export const getUserToken = async (
  app: Express,
  user: UserInput,
): Promise<Tokens> => {
  const response = await request(app).post("/auth/register").send(user);

  return getTokensFromResponse(response) as Tokens;
};

export const getTokensFromResponse = (response: Response) => {
  return Object.fromEntries(
    ((response.headers["set-cookie"] ?? []) as unknown as string[])?.map(
      (cookie) => {
        const [name, value] = cookie.split("=");
        const token = value.split(";")[0];

        return [name, token];
      },
    ),
  );
};

export const expectTokens = (response: Response) => {
  expect(response.headers["set-cookie"][0]).toContain(
    `${accessTokenCookieName}=`,
  );
  expect(response.headers["set-cookie"][1]).toContain(
    `${refreshTokenCookieName}=`,
  );
  expect(response.headers["set-cookie"][0]).not.toContain(
    `${accessTokenCookieName}=undefined`,
  );
  expect(response.headers["set-cookie"][1]).not.toContain(
    `${refreshTokenCookieName}=undefined`,
  );
};

export const expectNoTokens = (response: Response) => {
  expect(response.headers["set-cookie"][0]).toContain(
    `${accessTokenCookieName}=undefined`,
  );
  expect(response.headers["set-cookie"][1]).toContain(
    `${refreshTokenCookieName}=undefined`,
  );
};

export const getCookieSetters = (userTokens: Tokens) => [
  `${refreshTokenCookieName}=${userTokens.refreshToken}`,
  `${accessTokenCookieName}=${userTokens.accessToken}`,
];
