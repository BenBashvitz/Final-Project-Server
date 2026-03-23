import { NextFunction, Response } from "express";
import { UPLOADS_ROUTE } from "../consts";
import { FileRequest } from "../types/request";
import { removeFile } from "../utils/removeLocalFile";
import { DeleteOldImgSchema } from "../schemas/file";
import z, { ZodError } from "zod";
import { unlink } from "fs/promises";
import config from "../configs/envVar";

export const getImgUrl = (req: FileRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).send("No file was sent");
  }

  const base = `${config.SERVER_URL}:${config.PORT}/`;

  const imgUrl = `${base}${UPLOADS_ROUTE}/${req.file.filename}`;

  res.status(200).send({ imgUrl });
};

export const deleteOldImg = async (
  req: FileRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { oldImgUrl } = DeleteOldImgSchema.parse(req.body);

    await removeFile(oldImgUrl).catch((error) => {
      console.error(
        `An error occurred while deleting the old post image: `,
        error,
      );
    });

    next();
  } catch (error) {
    if (req.file?.path) {
      await unlink(req.file.path);
    }

    if (error instanceof ZodError) {
      return res.status(400).send(z.treeifyError(error));
    }

    console.error("An error occurred while deleting the old image: ", error);

    res.status(500).send("An error occurred while deleting the old image");
  }
};
