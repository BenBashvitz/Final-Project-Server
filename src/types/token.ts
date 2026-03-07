export type TokenPayload = { userId: string; iat: number; exp: number };
export type Tokens = {
  token: string;
  refreshToken: string;
};
