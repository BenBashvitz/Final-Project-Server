import { Express } from "express";
import mongoose from "mongoose";
import request from "supertest";
import { accessTokenCookieName, refreshTokenCookieName } from "../consts";
import initApp from "../index";
import userModel from "../models/userModel";
import type { Tokens } from "../types/token";
import { USERS } from "./consts";
import {
  expectNoTokens,
  expectTokens,
  getTokensFromResponse,
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
      .set("Cookie", [
        `${refreshTokenCookieName}=${userTokens[0].refreshToken}`,
        `${accessTokenCookieName}=${userTokens[0].accessToken}`,
      ]);

    expect(response.statusCode).toBe(200);
    expectNoTokens(response);
  });

  test("should fail to refresh token after logout", async () => {
    await request(app)
      .post("/auth/logout")
      .set("Cookie", [
        `${refreshTokenCookieName}=${userTokens[0].refreshToken}`,
        `${accessTokenCookieName}=${userTokens[0].accessToken}`,
      ]);

    const response = await request(app)
      .post("/auth/refresh-token")
      .set("Cookie", [
        `${refreshTokenCookieName}=${userTokens[0].refreshToken}`,
        `${accessTokenCookieName}=${userTokens[0].accessToken}`,
      ]);

    expect(response.statusCode).toBe(401);
  });

  test("should return 500 if logout fails", async () => {
    jest
      .spyOn(userModel, "updateOne")
      .mockRejectedValueOnce(new Error("Database error"));

    const response = await request(app)
      .post("/auth/logout")
      .set("Cookie", [
        `${refreshTokenCookieName}=${userTokens[0].refreshToken}`,
        `${accessTokenCookieName}=${userTokens[0].accessToken}`,
      ]);

    expect(response.status).toBe(500);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
