import { Request } from "express";
import type { User } from "./user";

export type AuthRequest = Request & { user?: Pick<User, "_id"> };
export type FileRequest = Request & { file?: Express.Multer.File };

export enum ResponseErrorMessage {
  INVALID_LOGIN_CREDENTIALS = "The username or password are incorrect.",
  INVALID_REFRESH_TOKEN = "Invalid refresh token.",
  CREDENTIALS_ALREADY_TAKEN = "The username or email are already taken.",
  ERROR_REGISTERING_USER = "There was an error registering the user.",
  ERROR_LOGGING_OUT = "There was an error logging out.",
  POST_IS_ALREADY_LIKED_BY_USER = "The post is already liked by the user.",
}
