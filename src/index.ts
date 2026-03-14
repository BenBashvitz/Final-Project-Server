// Noam-Shimoni-213785298-Ben-Bashvitz-324228139
import express from "express";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";
import authRouter from "./routes/authRoutes";
import postRouter from "./routes/postRoutes";
import multerRouter from "./routes/multerRoutes";
import swaggerSpec from "./swagger";
import cors from "cors";
import config from "./config";

const initApp = async () => {
  const app = express();
  app.use(express.json());
  app.use(
    cors({
      origin: config.CLIENT_URL,
    }),
  );

  await mongoose.connect(config.MONGODB_URL);

  const db = mongoose.connection;

  db.on("error", (error) => {
    console.error("An error occurred while connecting to MongoDB: ", error);
  });

  db.once("open", () => {
    console.log("Connected to MongoDB");
  });

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use("/post", postRouter);
  app.use("/auth", authRouter);
  app.use("/upload", multerRouter);
  app.use("/uploads", express.static("public/uploads"));

  return app;
};

export default initApp;
