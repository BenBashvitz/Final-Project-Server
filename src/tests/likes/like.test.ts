import { Express } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import initApp from "../../index";
import likeModel from "../../models/likeModel";
import postModel from "../../models/postModel";
import userModel from "../../models/userModel";
import type { LikeResponse } from "../../types/like";
import { RawPost } from "../../types/post";
import { TokenPayload, Tokens } from "../../types/token";
import { USERS } from "../consts";
import { POSTS } from "../posts/consts";
import type { PostInputWithUserId } from "../posts/types";
import { getUserToken } from "../utils";

let app: Express;
let userTokens: Tokens;
let userId: string;

beforeAll(async () => {
  app = await initApp();

  await postModel.deleteMany();
  await userModel.deleteMany();
  await likeModel.deleteMany();
  userTokens = await getUserToken(app, USERS[0]);
  userId = (jwt.decode(userTokens.token) as TokenPayload).userId;
});

beforeEach(async () => {
  await postModel.deleteMany();
  await likeModel.deleteMany();
});

describe("with post creation", () => {
  let post: RawPost;

  beforeEach(async () => {
    const postToInsert: PostInputWithUserId[] = POSTS.map((post) => ({
      ...post,
      userId,
    }));

    const createdPosts = await postModel.create(postToInsert);

    post = createdPosts[0].toObject();
  });

  describe("Like post", () => {
    it("should like a post", async () => {
      const response = await request(app).post(`/like/${post._id}`);
      // .set("Authorization", `Bearer ${userTokens.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject<LikeResponse>({
        _id: post._id.toString(),
        likeCount: post.likeCount + 1,
        isLikedByCurrentUser: true,
      });
    });

    // test like post with bad request
    it("should return 400 for invalid post ID", async () => {
      const response = await request(app).post("/like/invalidPostId");
      // .set("Authorization", `Bearer ${userTokens.token}`);
      expect(response.status).toBe(400);
    });

    it("should return 404 for non-existing post", async () => {
      const nonExistingPostId = new mongoose.Types.ObjectId();
      const response = await request(app).post(`/like/${nonExistingPostId}`);
      // .set("Authorization", `Bearer ${userTokens.token}`);
      expect(response.status).toBe(404);
    });
  });

  describe("Unlike post", () => {
    beforeEach(async () => {
      await likeModel.create({ postId: post._id, userId });
    });

    it("should unlike a post", async () => {
      const response = await request(app).post(`/like/unlike/${post._id}`);
      // .set("Authorization", `Bearer ${userTokens.token}`);
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject<LikeResponse>({
        _id: post._id.toString(),
        likeCount: post.likeCount - 1,
        isLikedByCurrentUser: false,
      });
    });

    it("should return 400 for invalid post ID", async () => {
      const response = await request(app).post("/like/unlike/invalidPostId");
      // .set("Authorization", `Bearer ${userTokens.token}`);
      expect(response.status).toBe(400);
    });

    it("should return 404 for non-existing post", async () => {
      const nonExistingPostId = new mongoose.Types.ObjectId();
      const response = await request(app).post(
        `/like/unlike/${nonExistingPostId}`,
      );
      // .set("Authorization", `Bearer ${userTokens.token}`);
      expect(response.status).toBe(404);
    });
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
