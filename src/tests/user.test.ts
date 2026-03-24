import mongoose from "mongoose";
import initApp from "../index";
import userModel from "../models/userModel";
import request from "supertest";
import { Express } from "express";
import { USERS } from "./consts";
import type { RawUser } from "../types/user";

let app: Express;

beforeAll(async () => {
  app = await initApp();

  await userModel.deleteMany();
});

describe("With created user", () => {
  let user: RawUser;

  beforeEach(async () => {
    await userModel.deleteMany();

    user = (await userModel.create(USERS[0])).toObject();
  });

  describe("Get user by ID", () => {
    it("Get user by ID", async () => {
      const response = await request(app).get(`/user/${user._id.toString()}`);

      const { _id, ...restUser } = user;

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(restUser);
      expect(response.body._id).toBe(_id.toString());
    });

    it("should return 404 if user not found", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const response = await request(app).get(`/user/${nonExistentId}`);

      expect(response.status).toBe(404);
    });

    it("should return 500 if an error occurs", async () => {
      jest
        .spyOn(userModel, "findById")
        .mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app).get(`/user/${user._id.toString()}`);

      expect(response.status).toBe(500);
    });
  });

  describe("Update user", () => {
    it("should update a user successfully and return 201", async () => {
      const updatedData = {
        username: "updatedUser",
        email: "updatedEmail",
        password: "updatedPassword",
      };
      const response = await request(app)
        .put(`/user/${user._id.toString()}`)
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
        .send(updatedData);

      expect(response.status).toBe(500);
    });
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
