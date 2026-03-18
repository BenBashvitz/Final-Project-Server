import { Express } from "express";
import mongoose from "mongoose";
import request from "supertest";
import initApp from "../../index";
import postModel from "../../models/postModel";
import type { Tokens } from "../../types/token";
import { POSTS } from "../posts/consts";
import { setupMultipleUsersForTests } from "../utils";
import { COMMENTS } from "./consts";

let app: Express;
let userIds: string[] = [];
let userTokens: Tokens[] = [];
let postIds: string[];

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

  console.log("Posts with userId: ", postsWithUserId);

  const posts = await postModel.create(postsWithUserId);
  postIds = posts.map((post) => post._id.toString());
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Create comment", () => {
  it("should create a comment successfully", async () => {
    const commentData = {
      ...COMMENTS[0],
      postId: postIds[0],
    };

    const response = await request(app)
      .post("/comment")
      //   .set("Authorization", `Bearer ${userTokens[0].token}`)
      .send(commentData);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject(commentData);
  });

  it("should fail to create a comment with missing required fields", async () => {
    const commentData = {
      message: "Test Comment",
    };

    const response = await request(app)
      .post("/comment")
      //   .set("Authorization", `Bearer ${userTokens[0].token}`)
      .send(commentData);

    expect(response.status).toBe(400);
  });
});
