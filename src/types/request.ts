import { Request } from "express";
import type { User } from "./user";

export type AuthRequest = Request & { user?: Pick<User, "_id"> };

export enum ResponseErrorMessage {
  INVALID_LOGIN_CREDENTIALS = "The username or password are incorrect.",
  INVALID_REFRESH_TOKEN = "Invalid refresh token.",
  CREDENTIALS_ALREADY_TAKEN = "The username or email are already taken.",
  ERROR_REGISTERING_USER = "There was an error registering the user.",
}