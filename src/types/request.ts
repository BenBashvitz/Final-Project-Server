import { Request } from "express";
import { User } from "./user";

export type AuthRequest = Request & { user?: Pick<User, "_id"> };

export enum ResponseErrorMessage {
  INVALID_LOGIN_CREDENTIALS = "Invalid username or password.",
  MISSING_LOGIN_CREDENTIALS = "Username and password are required.",
  MISSING_REGISTER_CREDENTIALS = "Email, username and password are required.",
  INVALID_REFRESH_TOKEN = "Invalid refresh token.",
  MISSING_REFRESH_TOKEN = "Refresh token is required.",
}