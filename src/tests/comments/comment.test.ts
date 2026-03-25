import { Express } from "express";
import mongoose from "mongoose";
import request from "supertest";
import initApp from "../../index";
import postModel from "../../models/postModel";
import type { Tokens } from "../../types/token";
import { POSTS } from "../posts/consts";
import { getCookieSetters, setupMultipleUsersForTests } from "../utils";
import { COMMENTS } from "./consts";

let app: Express;
let userTokens: Tokens[] = [];
let postIds: string[];

beforeAll(async () => {
  app = await initApp();
  await postModel.deleteMany();

  const userData = await setupMultipleUsersForTests(app);
  userTokens = userData.userTokens;
  const userIds = userData.userIds;

  const postsWithUserId = POSTS.map((post, index) => ({
    ...post,
    userId: userIds[index],
  }));

  const posts = await postModel.create(postsWithUserId);
  postIds = posts.map((post) => post._id.toString());
});

afterAll(async () => {
  await mongoose.connection.close();
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
