import express, { Response } from "express";
import multer from "multer";
import { FileRequest } from "../types/request";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    const ext = file.originalname.split(".").filter(Boolean).slice(1).join(".");
    cb(null, Date.now() + "." + ext);
  },
});

const upload = multer({ storage: storage });

router.post(
  "/",
  upload.single("file"),
  function (req: FileRequest, res: Response) {
    const base = process.env.SERVER_URL + ":" + process.env.PORT + "/";

    console.log("req.file.path:", req.file?.path);

    const parts = req.file?.path.split("\\") ?? [];
    const imgUrl = base + "uploads/" + parts[parts.length - 1];

    console.log("router.post(/file: " + imgUrl);
    res.status(200).send({ imgUrl });
  },
);

export = router;
