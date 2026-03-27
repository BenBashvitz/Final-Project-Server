import { Express } from "express";
import mongoose from "mongoose";
import request from "supertest";
import initApp from "../index";
import commentModel from "../models/commentModel";
import postModel from "../models/postModel";
import type { Tokens } from "../types/token";
import { getCookieSetters, setupMultipleUsersForTests } from "./utils";
import { COMMENTS } from "./consts";
import type { CommentInputWithUserAndPostIds } from "./types";
import { POSTS } from "./consts";

let app: Express;
let userTokens: Tokens[] = [];
let postIds: string[];
let userIds: string[];

beforeAll(async () => {
  app = await initApp();
  await postModel.deleteMany();

  const userData = await setupMultipleUsersForTests(app);
  userTokens = userData.userTokens;
  userIds = userData.userIds;

  const postsWithUserId = POSTS.map((post, index) => ({
    ...post,
    userId: userIds[index],
  }));

  const posts = await postModel.create(postsWithUserId);
  postIds = posts.map((post) => post._id.toString());
});

beforeEach(async () => {
  await commentModel.deleteMany();
});

describe("Create comment", () => {
  it("should create a comment successfully", async () => {
    const response = await request(app)
      .post(`/post/${postIds[0]}/comment`)
      .set("Cookie", getCookieSetters(userTokens[0]))
      .send(COMMENTS[0]);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject(COMMENTS[0]);

    const commentInDb = await postModel.findById(postIds[0], {
      _id: 1,
      commentCount: 1,
    });
    expect(commentInDb?.commentCount).toBe(1);
  });

  it("should fail to create a comment with missing required fields", async () => {
    const commentData = {
      message: COMMENTS[0].message,
    };

    const response = await request(app)
      .post(`/post/${postIds[0]}/comment`)
      .set("Cookie", getCookieSetters(userTokens[0]))
      .send(commentData);

    expect(response.status).toBe(400);
  });
});

describe("With comments creation", () => {
  beforeEach(async () => {
    const commentsToInsert: CommentInputWithUserAndPostIds[] = COMMENTS.map(
      (comment, index) => ({
        ...comment,
        postId: postIds[index],
        userId: userIds[index],
      }),
    );

    await commentModel.create(commentsToInsert);
  });

  describe("Get comments for a post", () => {
    it("should get comments for a specific post", async () => {
      const response = await request(app).get(`/post/${postIds[0]}/comment`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty("message", COMMENTS[0].message);
      expect(response.body[0]).toHaveProperty<
        CommentInputWithUserAndPostIds["creationDate"]
      >("creationDate", COMMENTS[0].creationDate);
      expect(response.body[0]).toHaveProperty<
        CommentInputWithUserAndPostIds["postId"]
      >("postId", postIds[0]);
      expect(response.body[0]).toHaveProperty<
        CommentInputWithUserAndPostIds["userId"]
      >("user._id", userIds[0]);
    });

    it("should return 404 for non-existent post", async () => {
      const nonExistentPostId = new mongoose.Types.ObjectId().toString();
      const response = await request(app).get(
        `/post/${nonExistentPostId}/comment`,
      );
      expect(response.status).toBe(404);
    });

    it("should return 400 for invalid post ID", async () => {
      const invalidPostId = "invalid-id";
      const response = await request(app).get(`/post/${invalidPostId}/comment`);
      expect(response.status).toBe(400);
    });
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
