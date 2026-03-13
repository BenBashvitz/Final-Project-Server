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
import type { PostInputWithUserId, TestPostPage } from "./types";
import { POSTS } from "./consts";

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
        nextCursor: {
          creationDate: POSTS[POST_PAGE_SIZE - 1].creationDate,
        },
      };

      const firstPostPageResponse = await request(app).get("/post");
      expect(firstPostPageResponse.status).toBe(200);
      expect(firstPostPageResponse.body).toMatchObject(firstPostPage);
      expect(firstPostPageResponse.body.posts.length).toBe(POST_PAGE_SIZE);

      const secondPostPage: TestPostPage = {
        posts: POSTS.slice(POST_PAGE_SIZE),
        nextCursor: {
          creationDate: null,
          _id: null,
        },
      };

      const secondPostPageResponse = await request(app).get(
        `/post?cursor=${JSON.stringify(firstPostPageResponse.body.nextCursor)}`,
      );
      expect(secondPostPageResponse.status).toBe(200);
      expect(secondPostPageResponse.body).toMatchObject(secondPostPage);
      expect(secondPostPageResponse.body.posts.length).toBe(POST_PAGE_SIZE);
    });
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
