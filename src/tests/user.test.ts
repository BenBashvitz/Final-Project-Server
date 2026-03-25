import mongoose from "mongoose";
import initApp from "../index";
import userModel from "../models/userModel";
import request from "supertest";
import {Express} from "express";
import type {UserUpdate} from "../types/user";
import {getCookieSetters, setupMultipleUsersForTests} from "./utils";
import {Tokens} from "../types/token";

let app: Express;

beforeAll(async () => {
    app = await initApp();

    await userModel.deleteMany();
});

describe("With created user", () => {
    let userIds: string[];
    let userTokens: Tokens[];

    beforeEach(async () => {
        await userModel.deleteMany();

        const userIdsAndTokens= await setupMultipleUsersForTests(app);
        userIds = userIdsAndTokens.userIds;
        userTokens = userIdsAndTokens.userTokens;
    });

    describe("Update user", () => {
        it("should update a user successfully and return 200", async () => {
            const updatedData: UserUpdate = {
                username: "updatedUser",
                imgUrl: 'public/uploads/beautiful-view-22.jpg'
            };
            const response = await request(app)
                .put(`/user/${userIds[0]}`)
                .set("Cookie", getCookieSetters(userTokens[0]))
                .send(updatedData);

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject(updatedData);
            expect(response.body._id).toBe(userIds[0]);
        });

        it("should return 400 when trying to update a user with invalid input", async () => {
            const response = await request(app)
                .put(`/user/${userIds[0]}`)
                .set("Cookie", getCookieSetters(userTokens[0]))
                .send({});
            expect(response.status).toBe(400);
        });

        it("should return 403 if the user trying to update isn't the user being updated", async () => {
            const updatedData: UserUpdate = {
                username: "updatedUser",
                imgUrl: 'public/uploads/beautiful-view-22.jpg'
            };
            const response = await request(app)
                .put(`/user/${userIds[0]}`)
                .set("Cookie", getCookieSetters(userTokens[1]))
                .send(updatedData);

            expect(response.status).toBe(403);
        });

        it("should return 404 if user not found", async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            const updatedData: UserUpdate = {
                username: "updatedUser",
                imgUrl: 'public/uploads/beautiful-view-22.jpg'
            };

            const response = await request(app)
                .put(`/user/${nonExistentId}`)
                .set("Cookie", getCookieSetters(userTokens[0]))
                .send(updatedData);

            expect(response.status).toBe(404);
        });

        it("should return 500 if an error occurs", async () => {
            jest
                .spyOn(userModel, "findByIdAndUpdate")
                .mockRejectedValueOnce(new Error("Database error"));
            const updatedData = {
                username: "updatedUsername",
                imgUrl: 'public/uploads/beautiful-view-22.jpg'
            };

            const response = await request(app)
                .put(`/user/${userIds[0]}`)
                .set("Cookie", getCookieSetters(userTokens[0]))
                .send(updatedData);

            expect(response.status).toBe(500);
        });
    });
});

afterAll(async () => {
    await mongoose.connection.close();
});
