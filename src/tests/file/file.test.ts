import type { Express } from "express";
import request from "supertest";
import initApp from "../../index";
import mongoose from "mongoose";
import { EXAMPLE_FILE_NAME } from "./consts";

let app: Express;

beforeAll(async () => {
  app = await initApp();
});

describe("Upload file", () => {
  it("should upload a file and return its URL", async () => {
    const filePath = `${__dirname}/${EXAMPLE_FILE_NAME}`;

    const response = await request(app)
      .post("/upload")
      .attach("file", filePath);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("imgUrl");

    const fileUrl = response.body.imgUrl.replace(/^.*\/\/[^/]+/, "");

    const fileResponse = await request(app).get(fileUrl);
    expect(fileResponse.statusCode).toBe(200);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
