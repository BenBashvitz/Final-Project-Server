import { accessTokenCookieName, refreshTokenCookieName } from "../consts";

export type TokenPayload = { userId: string; iat: number; exp: number };

export type Tokens = {
  [accessTokenCookieName]: string;
  [refreshTokenCookieName]: string;
};
