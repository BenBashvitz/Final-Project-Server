export type TokenPayload = { userId: string; iat: number; exp: number };

export const accessTokenCookieName = 'accessToken' as const;
export const refreshTokenCookieName = 'refreshToken' as const;

export type Tokens = {
    [accessTokenCookieName]: string;
    [refreshTokenCookieName]: string;
};

