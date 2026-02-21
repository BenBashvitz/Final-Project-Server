import {Express} from "express";
import request from "supertest";
import userModel from "../models/userModel";
import Tokens from "../types/tokens";
import {USERS} from "./consts";
import TokenPayload from "../types/token";
import jwt from "jsonwebtoken";
import {UserInput} from "../types/user";

export const setupMultipleUsersForTests = async (app: Express) => {
  await userModel.deleteMany();

  const userTokens: Tokens[] = await Promise.all(USERS.map(user => getUserToken(app, user)));
  const userIds: string[] = userTokens.map(token => (jwt.decode(token.token) as TokenPayload).userId);

  return { userTokens, userIds };
};

export const getUserToken = async (app: Express, user: UserInput): Promise<Tokens> => {
  const response = await request(app)
    .post("/auth/register")
    .send(user);

  return response.body;
};
