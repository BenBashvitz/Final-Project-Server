import express from "express";
import { deleteOldImg, getImgUrl } from "../controllers/multerController";
import upload from "../configs/multer";

const router = express.Router();

router.post("/", upload.single("file"), getImgUrl);

router.put("/", upload.single("file"), deleteOldImg, getImgUrl);

export default router;
