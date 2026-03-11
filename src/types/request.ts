import { Request } from "express";
import { User } from "./user";

export type UserReq = {
  userId: string;
};

export type AuthRequest = Request & { user?: Pick<User, "_id"> };
export type FileRequest = Request & { file?: Express.Multer.File };
