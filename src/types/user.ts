import { Types } from "mongoose";

export type User = {
  email: string;
  password: string;
  username: string;
  _id: string;
  refreshTokens: string[];
};

export type RawUser = Omit<User, "_id"> & { _id: Types.ObjectId };

export type UserInput = Omit<User, "_id">;
