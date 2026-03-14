import { Response, NextFunction } from "express";
import { FileRequest } from "../types/request";
import { unlink } from "fs/promises";

export const getImgUrl = (req: FileRequest, res: Response) => {
  const base = process.env.SERVER_URL + ":" + process.env.PORT + "/";

  console.log("req.file.path:", req.file?.path);

  const parts = req.file?.path.split("\\") ?? [];
  const imgUrl = base + "uploads/" + parts[parts.length - 1];

  console.log("router.post(/file: " + imgUrl);

  res.status(200).send({ imgUrl });
};

export const deleteOldImg = async (
  req: FileRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const oldImgUrlParts = req.body.oldImgUrl.split("/");
    const oldImgName = oldImgUrlParts[oldImgUrlParts.length - 1];
    const oldImgPath = "public/uploads/" + oldImgName;

    await unlink(oldImgPath);
    next();
  } catch (error) {
    console.error("An error occurred while deleting the old image: ", error);

    res.status(500).send("An error occurred while deleting the old image");
  }
};
