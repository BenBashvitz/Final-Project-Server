// Noam-Shimoni-213785298-Ben-Bashvitz-324228139
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";
import config from "./configs/envVar";
import { UPLOADS_ROUTE } from "./consts";
import authRouter from "./routes/authRoutes";
import likeRouter from "./routes/likeRoutes";
import multerRouter from "./routes/multerRoutes";
import postRouter from "./routes/postRoutes";
import swaggerSpec from "./swagger";
import userRoutes from "./routes/userRoutes";

const initApp = async () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    cors({
      origin: config.CLIENT_URL,
      credentials: true,
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
  app.use("/like", likeRouter);
  app.use("/auth", authRouter);
  app.use("/upload", multerRouter);
  app.use(`/${UPLOADS_ROUTE}`, express.static("public/uploads"));
  app.use("/auth", authRouter);
  app.use("/user", userRoutes);

  return app;
};

export default initApp;
