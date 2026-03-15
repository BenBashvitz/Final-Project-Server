import { NextFunction, Response } from "express";
import { UPLOADS_ROUTE } from "../consts";
import { FileRequest } from "../types/request";
import { removeFile } from "../utils/removeLocalFile";
import { DeleteOldImgSchema } from "../schemas/file";
import z, { ZodError } from "zod";
import { unlink } from "fs/promises";

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
    const { oldImgUrl } = DeleteOldImgSchema.parse(req.body);

    await removeFile(oldImgUrl);

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      if (req.file?.path) {
        await unlink(req.file.path);
      }

      return res.status(400).send(z.treeifyError(error));
    }

    console.error("An error occurred while deleting the old image: ", error);

    res.status(500).send("An error occurred while deleting the old image");
  }
};
