import { Express } from "express";
import request from "supertest";
import { Tokens } from "../types/token";
import { UserInput } from "../types/user";

export const getUserToken = async (
  app: Express,
  user: UserInput,
): Promise<Tokens> => {
  const response = await request(app).post("/auth/register").send(user);

  return response.body;
};
