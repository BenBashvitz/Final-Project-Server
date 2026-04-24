import swaggerUi from "swagger-ui-express";
import swaggerSpec from "../swagger";
import postRouter from "./postRoutes";
import likeRouter from "./likeRoutes";
import authRouter from "./authRoutes";
import multerRouter from "./multerRoutes";
import {UPLOADS_ROUTE} from "../consts";
import express from "express";
import userRoutes from "./userRoutes";

const router = express.Router();

router.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
router.use("/post", postRouter);
router.use("/like", likeRouter);
router.use("/auth", authRouter);
router.use("/upload", multerRouter);
router.use(`/${UPLOADS_ROUTE}`, express.static("public/uploads"));
router.use("/user", userRoutes);

export default router;