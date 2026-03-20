import express, { Response } from "express";
import multer from "multer";
import { FileRequest } from "../types/request";
import { UPLOADS_ROUTE } from "../consts";
import config from "../config";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads");
  },
  filename: (req, file, cb) => {
    const fileExtension = file.originalname.split(".").pop() ?? "jpg";
    cb(null, `${Date.now()}.${fileExtension}`);
  },
});

const upload = multer({ storage });

router.post(
  "/",
  upload.single("file"),
  function (req: FileRequest, res: Response) {
    if (!req.file) {
      return res.status(400).send("No file was sent");
    }

    const base = `${config.SERVER_URL}:${config.PORT}/`;

    const imgUrl = `${base}${UPLOADS_ROUTE}/${req.file.filename}`;

    res.status(200).send({ imgUrl });
  },
);

export default router;
