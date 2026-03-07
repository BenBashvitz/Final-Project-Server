import {Express} from "express";
import mongoose from "mongoose";
import request from "supertest";
import initApp from "../index";
import userModel from "../models/userModel";
import {accessTokenCookieName, refreshTokenCookieName, Tokens} from "../types/token";
import {USERS} from "./consts";
import {expectNoTokens, expectTokens, getTokensFromResponse, setupMultipleUsersForTests} from "./utils";

let app: Express;

beforeAll(async () => {
    app = await initApp();
    await userModel.deleteMany();
});

describe("user registration", () => {
    test("should register user", async () => {
        const response = await request(app).post("/auth/register").send(USERS[0]);

        expect(response.statusCode).toBe(201);
        expectTokens(response);
    });
});

describe("user login", () => {
    test("should login user", async () => {
        const response = await request(app).post("/auth/login").send(USERS[0]);

        expect(response.statusCode).toBe(200);
        expectTokens(response);
    });
});

describe("Refresh token", () => {
    let userTokens: Tokens[] = [];

    beforeEach(async () => {
        const userData = await setupMultipleUsersForTests(app);
        userTokens = userData.userTokens;
    });

    it("should fail to refresh token with double use", async () => {
        await new Promise((r) => setTimeout(r, 1000));

        const refreshTokenResponse = await request(app)
            .post("/auth/refresh-token")
            .set('Cookie', [`${refreshTokenCookieName}=${userTokens[0].refreshToken}`])
            .send();

        expect(refreshTokenResponse.statusCode).toBe(200);
        expectTokens(refreshTokenResponse);

        const newRefreshToken = getTokensFromResponse(refreshTokenResponse).refreshToken;

        const secondRefreshTokenResponse = await request(app)
            .post("/auth/refresh-token")
            .set('Cookie', [`${refreshTokenCookieName}=${userTokens[0].refreshToken}`])
            .send();

        expect(secondRefreshTokenResponse.statusCode).toBe(401);

        const thirdRefreshTokenResponse = await request(app)
            .post("/auth/refresh-token")
            .set('Cookie', [`${refreshTokenCookieName}=${newRefreshToken}`])
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
            .set('Cookie', [`${refreshTokenCookieName}=${userTokens[0].refreshToken}`,`${accessTokenCookieName}=${userTokens[0].accessToken}`])

        expect(response.statusCode).toBe(200);
        expectNoTokens(response);
    });

    test("should fail to refresh token after logout", async () => {
        await request(app)
            .post("/auth/logout")
            .set('Cookie', [`${refreshTokenCookieName}=${userTokens[0].refreshToken}`,`${accessTokenCookieName}=${userTokens[0].accessToken}`])

        const response = await request(app)
            .post("/auth/refresh-token")
            .set('Cookie', [`${refreshTokenCookieName}=${userTokens[0].refreshToken}`,`${accessTokenCookieName}=${userTokens[0].accessToken}`])

        expect(response.statusCode).toBe(401);
    });

    test("should return 500 if logout fails", async () => {
        jest.spyOn(userModel, "updateOne").mockRejectedValueOnce(new Error("Database error"));

        const response = await request(app)
            .post("/auth/logout")
            .set('Cookie', [`${refreshTokenCookieName}=${userTokens[0].refreshToken}`,`${accessTokenCookieName}=${userTokens[0].accessToken}`])

        expect(response.status).toBe(500);
    })
});

afterAll(async () => {
    await mongoose.connection.close();
});
