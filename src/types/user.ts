import type {DefaultSchemaOptions, Document, ResolveSchemaOptions, Types} from "mongoose";

export type User = {
  email: string;
  password: string;
  username: string;
  _id: string;
  refreshTokens: string[];
};

export type RawUser = Omit<User, "_id"> & { _id: Types.ObjectId };

export type UserInput = Omit<User, "_id" | 'refreshTokens'>;

export type UserDocument = Document<unknown, {}, RawUser, {
  id: string
}, ResolveSchemaOptions<DefaultSchemaOptions>> & Omit<Omit<User, "_id"> & {
  _id: Types.ObjectId
} & Required<{
  _id: Types.ObjectId
}> & {
  __v: number
}, "id"> & {
  id: string
}