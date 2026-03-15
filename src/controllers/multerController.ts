import { NextFunction, Response } from "express";
import { UPLOADS_ROUTE } from "../consts";
import { FileRequest } from "../types/request";
import { removeFile } from "../utils/removeLocalFile";

export const getImgUrl = (req: FileRequest, res: Response) => {
  const base = process.env.SERVER_URL + ":" + process.env.PORT + "/";

  const parts = req.file?.path.split("\\") ?? [];
  const imgUrl = base + `${UPLOADS_ROUTE}/` + parts[parts.length - 1];

  res.status(200).send({ imgUrl });
};

export const deleteOldImg = async (
  req: FileRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    await removeFile(req.body.oldImgUrl);

    next();
  } catch (error) {
    console.error("An error occurred while deleting the old image: ", error);

    res.status(500).send("An error occurred while deleting the old image");
  }
};
