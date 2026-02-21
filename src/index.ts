// Noam-Shimoni-213785298-Ben-Bashvitz-324228139
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";
import userRouter from "./routes/userRoutes";
import authRouter from "./routes/authRoutes";
import swaggerSpec from "./swagger";

dotenv.config({ path: ".env.dev" });

const initApp = async () => {
  const app = express();
  app.use(express.json());

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

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use("/user", userRouter);
  app.use("/auth", authRouter);

  return app;
};

export default initApp;
