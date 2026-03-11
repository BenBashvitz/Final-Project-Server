// Noam-Shimoni-213785298-Ben-Bashvitz-324228139
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import authRouter from "./routes/authRoutes";
import multerRouter from "./routes/multerRoutes";
import postRouter from "./routes/postRoutes";

dotenv.config({ path: ".env.dev" });

const initApp = async () => {
  const app = express();
  app.use(express.json());
  app.use(
    cors({
      origin: ["http://localhost:5173"],
    }),
  );

  const dbUrl = process.env.MONGODB_URL;

  if (!dbUrl) {
    throw new Error("Not defined db url");
  }

  await mongoose.connect(dbUrl);

  const db = mongoose.connection;

  db.on("error", (error) => {
    console.error("An error occurred while connecting to MongoDB: ", error);
  });

  db.once("open", () => {
    console.log("Connected to MongoDB");
  });

  app.use("/post", postRouter);
  app.use("/auth", authRouter);
  app.use("/upload", multerRouter);

  return app;
};

export default initApp;
