import { Express } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { accessTokenCookieName, refreshTokenCookieName } from "../../consts";
import initApp from "../../index";
import postModel from "../../models/postModel";
import userModel from "../../models/userModel";
import { RawPost } from "../../types/post";
import { TokenPayload, Tokens } from "../../types/token";
import testConfig from "../config";
import { USERS } from "../consts";
import { getUserToken } from "../utils";
import { POSTS } from "./consts";
import type { PostInput, PostInputWithUserId, TestPostPage } from "./types";

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

beforeEach(async () => {
  await postModel.deleteMany();
});

describe("Create post", () => {
  test("should create posts", async () => {
    for (const post of POSTS) {
      const response = await request(app)
        .post("/post")
        .set("Cookie", [
          `${refreshTokenCookieName}=${userTokens.refreshToken}`,
          `${accessTokenCookieName}=${userTokens.accessToken}`,
        ])
        .send(post);

      expect(response.statusCode).toBe(201);
      expect(response.body).toMatchObject(post);
    }
  });

  it("should fail to create a post with missing required fields", async () => {
    const incompletePost: Partial<PostInput> = {
      imgUrl: POSTS[0].imgUrl,
    };

    const response = await request(app)
      .post("/post")
      .send(incompletePost)
      .set("Cookie", [
        `${refreshTokenCookieName}=${userTokens.refreshToken}`,
        `${accessTokenCookieName}=${userTokens.accessToken}`,
      ]);

    expect(response.status).toBe(400);
  });
});

describe("with post creation", () => {
  let post: RawPost;

  beforeEach(async () => {
    const postToInsert: PostInputWithUserId[] = POSTS.map((post) => ({
      ...post,
      userId,
    }));

    const createdPosts = await postModel.create(postToInsert);

    post = createdPosts[0];
  });

  describe("Get posts", () => {
    it("should retrieve all pages of posts", async () => {
      const firstPostPage: TestPostPage = {
        posts: POSTS.slice(0, testConfig.POSTS_PAGE_SIZE),
        cursor: {
          creationDate: POSTS[testConfig.POSTS_PAGE_SIZE - 1].creationDate,
        },
      };

      const firstPostPageResponse = await request(app).get("/post");
      const responseBody: TestPostPage = firstPostPageResponse.body;

      expect(firstPostPageResponse.status).toBe(200);
      expect(responseBody).toMatchObject(firstPostPage);
      expect(responseBody.posts.length).toBe(testConfig.POSTS_PAGE_SIZE);

      const secondPostPage: TestPostPage = {
        posts: POSTS.slice(testConfig.POSTS_PAGE_SIZE),
        cursor: null,
      };

      const secondPostPageResponse = await request(app)
        .get(`/post`)
        .query({
          cursor: JSON.stringify(responseBody.cursor),
        });
      expect(secondPostPageResponse.status).toBe(200);
      expect(secondPostPageResponse.body).toMatchObject(secondPostPage);
      expect(secondPostPageResponse.body.posts.length).toBe(
        testConfig.POSTS_PAGE_SIZE,
      );
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

  describe("Edit post", () => {
    it("should edit a post", async () => {
      const descriptionUpdate = POSTS[0].description + " - updated";
      const imgUrlUpdate = POSTS[0].imgUrl.replace(".jpg", "_updated.jpg");

      const postUpdate: Omit<PostInput, "creationDate"> = {
        description: descriptionUpdate,
        imgUrl: imgUrlUpdate,
      };

      const response = await request(app)
        .put(`/post/${post._id}`)
        .set("Cookie", [
          `${refreshTokenCookieName}=${userTokens.refreshToken}`,
          `${accessTokenCookieName}=${userTokens.accessToken}`,
        ])
        .send(postUpdate);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(postUpdate);
    });

    it("should return 404 when trying to edit a non-existing post", async () => {
      const nonExistingPostId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/post/${nonExistingPostId}`)
        .set("Cookie", [
          `${refreshTokenCookieName}=${userTokens.refreshToken}`,
          `${accessTokenCookieName}=${userTokens.accessToken}`,
        ])
        .send(POSTS[0]);
      expect(response.status).toBe(404);
    });

    it("should return 400 when trying to edit a post with invalid input", async () => {
      const response = await request(app)
        .put(`/post/${post._id}`)
        .set("Cookie", [
          `${refreshTokenCookieName}=${userTokens.refreshToken}`,
          `${accessTokenCookieName}=${userTokens.accessToken}`,
        ])
        .send({ imgUrl: "not-a-url" });
      expect(response.status).toBe(400);
    });
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
