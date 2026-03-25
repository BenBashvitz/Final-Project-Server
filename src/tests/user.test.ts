import mongoose from "mongoose";
import initApp from "../index";
import userModel from "../models/userModel";
import request from "supertest";
import {Express} from "express";
import {USERS} from "./consts";
import type {RawUser} from "../types/user";
import {getCookieSetters, getUserToken} from "./utils";
import {Tokens} from "../types/token";

let app: Express;

beforeAll(async () => {
    app = await initApp();

    await userModel.deleteMany();
});

describe("With created user", () => {
    let user: RawUser;
    let userTokens: Tokens;

    beforeEach(async () => {
        await userModel.deleteMany();

        user = (await userModel.create(USERS[0])).toObject();
        userTokens = await getUserToken(app, USERS[0]);
    });

    describe("Update user", () => {
        it("should update a user successfully and return 200", async () => {
            const updatedData = {
                username: "updatedUser",
                email: user.email,
                password: user.password,
                imgUrl: 'public/uploads/beautiful-view-22.jpg'
            };
            const response = await request(app)
                .put(`/user/${user._id.toString()}`)
                .set("Cookie", getCookieSetters(userTokens))
                .send(updatedData);

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject(updatedData);
            expect(response.body._id).toBe(user._id.toString());
        });

        it("should return 403 if the user trying to update isn't the user being updated", async () => {
            const secondUserTokens = await getUserToken(app, USERS[1]);

            const updatedData = {
                username: "updatedUser",
                email: user.email,
                password: user.password,
                imgUrl: 'public/uploads/beautiful-view-22.jpg'
            };
            const response = await request(app)
                .put(`/user/${user._id.toString()}`)
                .set("Cookie", getCookieSetters(secondUserTokens))
                .send(updatedData);

            expect(response.status).toBe(201);
            expect(response.body).toMatchObject(updatedData);
            expect(response.body._id).toBe(user._id.toString());
        });

        it("should return 404 if user not found", async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            const updatedData = {
                username: "updatedUser",
                email: "updatedEmail",
                password: "updatedPassword",
            };

            const response = await request(app)
                .put(`/user/${nonExistentId}`)
                .set("Cookie", getCookieSetters(userTokens))
                .send(updatedData);

            expect(response.status).toBe(404);
        });

        it("should return 500 if an error occurs", async () => {
            jest
                .spyOn(userModel, "findByIdAndUpdate")
                .mockRejectedValueOnce(new Error("Database error"));

            const updatedData = {
                username: "updatedUser",
                email: "updatedEmail",
                password: "updatedPassword",
            };

            const response = await request(app)
                .put(`/user/${user._id.toString()}`)
                .set("Cookie", getCookieSetters(userTokens))
                .send(updatedData);

            expect(response.status).toBe(500);
        });
    });
});

afterAll(async () => {
    await mongoose.connection.close();
});
