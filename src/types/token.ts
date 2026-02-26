export type TokenPayload = { userId: string; iat: number; exp: number };

export type Tokens = {
    authorization: string;
    refresh_token: string;
};