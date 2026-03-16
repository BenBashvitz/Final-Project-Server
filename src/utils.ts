import env from './env';

export const jwtExpirationTimeInSeconds = () => env.JWT_EXPIRATION_TIME_SECONDS

export const refreshJwtExpirationTimeInSeconds = () => env.REFRESH_JWT_EXPIRATION_TIME_SECONDS

export const jwtExpirationTimeInMS = () => jwtExpirationTimeInSeconds() * 1000

export const refreshJwtExpirationTimeInMS = () => refreshJwtExpirationTimeInSeconds() * 1000