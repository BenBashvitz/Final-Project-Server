import { Express } from "express";
import mongoose from "mongoose";
import request from "supertest";
import { refreshTokenCookieName } from "../consts";
import initApp from "../index";
import postModel from "../models/postModel";
import userModel from "../models/userModel";
import type { Tokens } from "../types/token";
import { COMMENTS, POSTS, USERS } from "./consts";
import {
  expectNoTokens,
  expectTokens,
  getCookieSetters,
  getTokensFromResponse,
  setupMultiplePostsForTests,
  setupMultipleUsersForTests,
} from "./utils";

let app: Express;

beforeAll(async () => {
  app = await initApp();
  await userModel.deleteMany();
});

describe("user registration", () => {
  test("should register user", async () => {
    const response = await request(app).post("/auth/register").send(USERS[0]);

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      email: USERS[0].email,
      username: USERS[0].username,
    });
    expect(response.body._id).toBeTruthy();
    expectTokens(response);
  });
});

describe("user login", () => {
  test("should login user", async () => {
    const response = await request(app).post("/auth/login").send({
      username: USERS[0].username,
      password: USERS[0].password,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      email: USERS[0].email,
      username: USERS[0].username,
    });
    expect(response.body._id).toBeTruthy();
    expectTokens(response);
  });
});

describe("Refresh token", () => {
  let userTokens: Tokens[] = [];

  beforeEach(async () => {
    const userData = await setupMultipleUsersForTests(app);
    userTokens = userData.userTokens;
  });

  it("should refresh token", async () => {
    await new Promise((r) => setTimeout(r, 1000));

    const response = await request(app)
      .post("/auth/refresh-token")
      .set("Cookie", [
        `${refreshTokenCookieName}=${userTokens[0].refreshToken}`,
      ])
      .send();

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      email: USERS[0].email,
      username: USERS[0].username,
    });
    expect(response.body._id).toBeTruthy();
    expectTokens(response);
  });

  it("should fail to refresh token with double use", async () => {
    await new Promise((r) => setTimeout(r, 1000));

    const refreshTokenResponse = await request(app)
      .post("/auth/refresh-token")
      .set("Cookie", [
        `${refreshTokenCookieName}=${userTokens[0].refreshToken}`,
      ])
      .send();

    expect(refreshTokenResponse.statusCode).toBe(200);
    expectTokens(refreshTokenResponse);

    const newRefreshToken =
      getTokensFromResponse(refreshTokenResponse).refreshToken;

    const secondRefreshTokenResponse = await request(app)
      .post("/auth/refresh-token")
      .set("Cookie", [
        `${refreshTokenCookieName}=${userTokens[0].refreshToken}`,
      ])
      .send();

    expect(secondRefreshTokenResponse.statusCode).toBe(401);

    const thirdRefreshTokenResponse = await request(app)
      .post("/auth/refresh-token")
      .set("Cookie", [`${refreshTokenCookieName}=${newRefreshToken}`])
      .send();

    expect(thirdRefreshTokenResponse.statusCode).toBe(401);
  });
});

describe("User logout", () => {
  let userTokens: Tokens[] = [];

  beforeEach(async () => {
    const userData = await setupMultipleUsersForTests(app);
    userTokens = userData.userTokens;
  });

  test("should logout user", async () => {
    const response = await request(app)
      .post("/auth/logout")
      .set("Cookie", getCookieSetters(userTokens[0]));

    expect(response.statusCode).toBe(200);
    expectNoTokens(response);
  });

  test("should fail to refresh token after logout", async () => {
    await request(app)
      .post("/auth/logout")
      .set("Cookie", getCookieSetters(userTokens[0]));

    const response = await request(app)
      .post("/auth/refresh-token")
      .set("Cookie", getCookieSetters(userTokens[0]));

    expect(response.statusCode).toBe(401);
  });

  test("should return 500 if logout fails", async () => {
    jest
      .spyOn(userModel, "updateOne")
      .mockRejectedValueOnce(new Error("Database error"));

    const response = await request(app)
      .post("/auth/logout")
      .set("Cookie", getCookieSetters(userTokens[0]));

    expect(response.status).toBe(500);
  });
});

describe("Operations with accesses token", () => {
  let userTokens: Tokens[] = [];
  let userIds: string[] = [];

  beforeEach(async () => {
    const userData = await setupMultipleUsersForTests(app);
    userTokens = userData.userTokens;
    userIds = userData.userIds;
  });

  describe("Post", () => {
    test("should fail to create a post without a token", async () => {
      const response = await request(app).post("/post").send(POSTS[0]);

      expect(response.statusCode).toBe(401);
    });

    test("should fail to create a post with invalid token", async () => {
      const invalidToken = userTokens[0].accessToken + "a";

      const response = await request(app)
        .post("/post")
        .set(
          "Cookie",
          getCookieSetters({
            accessToken: invalidToken,
            refreshToken: userTokens[0].refreshToken,
          }),
        )
        .send(POSTS[0]);

      expect(response.statusCode).toBe(401);
    });

    test("should fail to create a post with expired token", async () => {
      await new Promise((r) => setTimeout(r, 5000));

      const response = await request(app)
        .post("/post")
        .set("Cookie", getCookieSetters(userTokens[0]))
        .send(POSTS[0]);

      expect(response.statusCode).toBe(401);
    }, 10000);
  });

  describe("Comment", () => {
    let postId: string;

    beforeEach(async () => {
      await postModel.deleteMany();

      postId = await setupMultiplePostsForTests(userIds);
    });

    test("should fail to create a comment without a token", async () => {
      const response = await request(app)
        .post(`/post/${postId}/comment`)
        .send({
          ...COMMENTS[0],
          postId,
        });

      expect(response.statusCode).toBe(401);
    });

    test("should fail to create a comment with invalid token", async () => {
      const invalidToken = userTokens[0].accessToken + "a";

      const response = await request(app)
        .post(`/post/${postId}/comment`)
        .set(
          "Cookie",
          getCookieSetters({
            accessToken: invalidToken,
            refreshToken: userTokens[0].refreshToken,
          }),
        )
        .send({
          ...COMMENTS[0],
          postId,
        });

      expect(response.statusCode).toBe(401);
    });

    test("should fail to create a comment with expired token", async () => {
      await new Promise((r) => setTimeout(r, 5000));

      const response = await request(app)
        .post(`/post/${postId}/comment`)
        .set("Cookie", getCookieSetters(userTokens[0]))
        .send({
          ...COMMENTS[0],
          postId,
        });

      expect(response.statusCode).toBe(401);
    }, 10000);
  });

  describe("User", () => {
    test("should fail to update a user with invalid token", async () => {
      const invalidToken = userTokens[0].accessToken + "a";

      const response = await request(app)
        .put(`/user/${userIds[0]}`)
        .set(
          "Cookie",
          getCookieSetters({
            accessToken: invalidToken,
            refreshToken: userTokens[0].refreshToken,
          }),
        )
        .send({
          imgUrl: "public/uploads/beautiful-view-22.jpg",
          username: "new username",
        });

      expect(response.statusCode).toBe(401);
    });

    test("should fail to create a user with expired token", async () => {
      await new Promise((r) => setTimeout(r, 5000));

      const response = await request(app)
        .put(`/user/${userIds[0]}`)
        .set(
          "Cookie",
          getCookieSetters({
            accessToken: userTokens[0].accessToken,
            refreshToken: userTokens[0].refreshToken,
          }),
        )
        .send({
          imgUrl: "public/uploads/beautiful-view-22.jpg",
          username: "new username",
        });

      expect(response.statusCode).toBe(401);
    }, 10000);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
