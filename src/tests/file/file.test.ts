import type { Express } from "express";
import mongoose from "mongoose";
import request from "supertest";
import initApp from "../../index";
import { removeFile } from "../../utils/removeLocalFile";
import { EXAMPLE_FILE_NAME, NEW_EXAMPLE_FILE_NAME } from "./consts";
import { removeBaseUrl } from "./utils";

let app: Express;
let oldImgUrl: string;
let newImgUrl: string | undefined;

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

    oldImgUrl = response.body.imgUrl;
    const fileUrl = removeBaseUrl(response.body.imgUrl);

    const fileResponse = await request(app).get(fileUrl);
    expect(fileResponse.statusCode).toBe(200);
  });

  it("should return 400 if no file is sent", async () => {
    const response = await request(app).post("/upload");

    expect(response.statusCode).toBe(400);
  });

  it("should replace an old file with a new one", async () => {
    const filePath = `${__dirname}/${NEW_EXAMPLE_FILE_NAME}`;

    const response = await request(app)
      .put("/upload")
      .attach("file", filePath)
      .field("oldImgUrl", oldImgUrl);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("imgUrl");

    newImgUrl = response.body.imgUrl;
    const fileUrl = removeBaseUrl(response.body.imgUrl);

    const fileResponse = await request(app).get(fileUrl);
    expect(fileResponse.statusCode).toBe(200);
  });

  it("should return a 400 error if oldImgUrl is missing while replacing a file", async () => {
    const filePath = `${__dirname}/${NEW_EXAMPLE_FILE_NAME}`;

    const response = await request(app).put("/upload").attach("file", filePath);

    expect(response.statusCode).toBe(400);
  });
});

afterAll(async () => {
  if (newImgUrl) {
    await removeFile(newImgUrl);
  }

  await mongoose.connection.close();
});
