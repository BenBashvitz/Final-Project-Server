import {Express} from "express";
import request from "supertest";
import userModel from "../models/userModel";
import Tokens from "../types/tokens";
import {USERS} from "./consts";
import TokenPayload from "../types/token";
import jwt from "jsonwebtoken";
import {UserInput} from "../types/user";
import {Response} from 'supertest';

export const setupMultipleUsersForTests = async (app: Express) => {
    await userModel.deleteMany();

    const userTokens: Tokens[] = await Promise.all(USERS.map(user => getUserToken(app, user)));
    const userIds: string[] = userTokens.map(tokens => (jwt.decode(tokens.authorization) as TokenPayload).userId);

    return {userTokens, userIds};
};

export const getUserToken = async (app: Express, user: UserInput): Promise<Tokens> => {
    const response = await request(app)
        .post("/auth/register")
        .send(user);

    return getTokensFromResponse(response) as Tokens;
};

export const getTokensFromResponse = (response: Response) => {
    return Object.fromEntries(((response.headers['set-cookie'] ?? []) as unknown as string[])?.map(cookie => {
        const [name, value] = cookie.split("=");
        const token = value.split(';')[0]

        return [name, token];
    }));
}

export const expectTokens = (response: Response) => {
    const cookies = getTokensFromResponse(response);

    expect(cookies.authorization).toBeTruthy();
    expect(cookies.refresh_token).toBeTruthy();
}

export const expectNoTokens= (response: Response) => {
    const cookies = getTokensFromResponse(response);

    expect(cookies.authorization).toBe('undefined');
    expect(cookies.refresh_token).toBe('undefined');
}