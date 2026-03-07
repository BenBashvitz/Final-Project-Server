import { Express } from "express";
import mongoose from "mongoose";
import request from "supertest";
import initApp from "../index";
import postModel from "../models/postModel";
import userModel from "../models/userModel";
import { Post } from "../types/post";
import { Tokens, TokenPayload } from "../types/token";
import { POSTS, USERS } from "./consts";
import { getUserToken } from "./utils";
import jwt from "jsonwebtoken";

let app: Express;
let userTokens: Tokens;
let userId: string;

beforeAll(async () => {
  app = await initApp();

  await postModel.deleteMany();
  await userModel.deleteMany();

  userTokens = await getUserToken(app, USERS[0]);
  userId = (jwt.decode(userTokens.token) as TokenPayload).userId;
});

describe("with post creation", () => {
  let post: Post;

  beforeEach(async () => {
    await postModel.deleteMany();

    const postToInsert = { ...POSTS[0], sender: userId };

    post = (await postModel.create(postToInsert)).toObject();
  });

  describe("Get posts", () => {
    it("should retrieve all posts", async () => {
      const response = await request(app).get("/post");
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
    });

    it("should get posts with filter", async () => {
      const response = await request(app).get(
        `/post?description=${post.description}`,
      );

      expect(response.statusCode).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].description).toBe(post.description);
    });

    it("should return empty array if no posts match filter", async () => {
      const response = await request(app).get(
        `/post?description=${post.description}NonExistent`,
      );
      expect(response.statusCode).toBe(200);
      expect(response.body.length).toBe(0);
    });
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
