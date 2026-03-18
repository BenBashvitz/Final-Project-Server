import { Express } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import initApp from "../../index";
import postModel from "../../models/postModel";
import userModel from "../../models/userModel";
import { TokenPayload, Tokens } from "../../types/token";
import { POST_PAGE_SIZE, USERS } from "../consts";
import { getUserToken } from "../utils";
import { POSTS } from "./consts";
import type { PostInputWithUserId, TestPostPage } from "./types";

let app: Express;
let userTokens: Tokens;
let userId: string;

beforeAll(async () => {
  app = await initApp();

  await postModel.deleteMany();
  await userModel.deleteMany();

  userTokens = await getUserToken(app, USERS[0]);
  userId = (jwt.decode(userTokens.accessToken) as TokenPayload).userId;
});

describe("with post creation", () => {
  beforeEach(async () => {
    await postModel.deleteMany();

    const postToInsert: PostInputWithUserId[] = POSTS.map((post) => ({
      ...post,
      userId,
    }));

    await postModel.create(postToInsert);
  });

  describe("Get posts", () => {
    it("should retrieve all pages of posts", async () => {
      const firstPostPage: TestPostPage = {
        posts: POSTS.slice(0, POST_PAGE_SIZE),
        cursor: {
          creationDate: POSTS[POST_PAGE_SIZE - 1].creationDate,
        },
      };

      const firstPostPageResponse = await request(app).get("/post");
      const responseBody: TestPostPage = firstPostPageResponse.body;

      expect(firstPostPageResponse.status).toBe(200);
      expect(responseBody).toMatchObject(firstPostPage);
      expect(responseBody.posts.length).toBe(POST_PAGE_SIZE);

      const secondPostPage: TestPostPage = {
        posts: POSTS.slice(POST_PAGE_SIZE),
        cursor: null,
      };

      const secondPostPageResponse = await request(app)
        .get(`/post`)
        .query({
          cursor: JSON.stringify(responseBody.cursor),
        });
      expect(secondPostPageResponse.status).toBe(200);
      expect(secondPostPageResponse.body).toMatchObject(secondPostPage);
      expect(secondPostPageResponse.body.posts.length).toBe(POST_PAGE_SIZE);
    });

    it("should return 400 for invalid cursor - missing _id", async () => {
      const response = await request(app)
        .get("/post")
        .query({ cursor: JSON.stringify({ creationDate: new Date() }) });
      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid cursor - missing creationDate", async () => {
      const response = await request(app)
        .get("/post")
        .query({
          cursor: JSON.stringify({ _id: new mongoose.Types.ObjectId() }),
        });
      expect(response.status).toBe(400);
    });
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
