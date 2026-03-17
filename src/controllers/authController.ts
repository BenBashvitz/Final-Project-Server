import bcrypt from "bcrypt";
import {Request, Response} from "express";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel";
import type {TokenPayload, Tokens} from "../types/token";
import {accessTokenCookieName, refreshTokenCookieName} from "../consts";
import {AuthRequest, ResponseErrorMessage} from "../types/request";
import type {UserDocument} from "../types/user";
import config from '../config';

const setTokens = (res: Response, tokens: Partial<Tokens>, invalidate?: boolean) => {
    const jwtExpirationTimeInMS = config.JWT_EXPIRATION_TIME_SECONDS * 1000

    res.cookie(accessTokenCookieName, tokens.accessToken, {
        maxAge: invalidate ? 0 : jwtExpirationTimeInMS,
        httpOnly: true,
        sameSite: 'strict',
        secure: true
    })
    const refreshJwtExpirationTimeInMS = config.REFRESH_JWT_EXPIRATION_TIME_SECONDS * 1000

    res.cookie(refreshTokenCookieName, tokens.refreshToken, {
        maxAge: invalidate ? 0 : refreshJwtExpirationTimeInMS,
        httpOnly: true,
        sameSite: 'strict',
        secure: true,
    })
}

const generateTokens = (userId: string): Tokens => {
    const jwtSecret = config.JWT_SECRET;

    const accessToken = jwt.sign({userId}, jwtSecret, {
        expiresIn: config.JWT_EXPIRATION_TIME_SECONDS,
    });

    const refreshToken = jwt.sign({userId}, jwtSecret, {
        expiresIn: config.REFRESH_JWT_EXPIRATION_TIME_SECONDS,
    });

    return {accessToken, refreshToken};
};

const saveTokensAndSendResponse = async (user: UserDocument, res: Response, status: number) => {
    const tokens = generateTokens(user._id.toString());

    user.refreshTokens.push(tokens.refreshToken);
    await user.save();

    setTokens(res, tokens);

    return res.status(status).send();
}

const register = async (req: Request, res: Response) => {
    const {email, password, username} = req.body;

    if (!email || !password || !username) {
        return res
            .status(400)
            .send(ResponseErrorMessage.MISSING_REGISTER_CREDENTIALS);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
        const user = await userModel.create({email, password: hashedPassword, username});

        return saveTokensAndSendResponse(user, res, 201)
    } catch (error) {
        console.error("Register error: ", error);

        return res.status(500).send("Error creating user.");
    }
};

const login = async (req: Request, res: Response) => {
    const {username, password} = req.body;

    if (!username || !password) {
        return res
            .status(400)
            .send(ResponseErrorMessage.MISSING_LOGIN_CREDENTIALS);
    }

    try {
        const user = await userModel.findOne({username});

        if (!user) {
            return res.status(401).send(ResponseErrorMessage.INVALID_LOGIN_CREDENTIALS);
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).send(ResponseErrorMessage.INVALID_LOGIN_CREDENTIALS);
        }

        return saveTokensAndSendResponse(user, res, 200)
    } catch (error) {
        console.error("Login error: ", error);

        return res.status(500).send("Error logging in.");
    }
};

const refreshToken = async (req: Request, res: Response) => {
    const oldRefreshToken = req.cookies[refreshTokenCookieName] ?? '';
    const jwtSecret = config.JWT_SECRET ?? "";

    if (!oldRefreshToken) {
        return res.status(400).send(ResponseErrorMessage.MISSING_REFRESH_TOKEN);
    }

    try {
        const decodedRefreshToken = jwt.verify(
            oldRefreshToken,
            jwtSecret
        ) as TokenPayload;

        const user = await userModel.findById(decodedRefreshToken.userId);

        if (!user) {
            return res.status(401).send(ResponseErrorMessage.INVALID_REFRESH_TOKEN);
        }

        if (!user.refreshTokens.includes(oldRefreshToken)) {
            user.refreshTokens = [];
            await user.save();

            return res.status(401).send(ResponseErrorMessage.INVALID_REFRESH_TOKEN);
        }

        user.refreshTokens = user.refreshTokens.filter(
            (refreshToken) => refreshToken !== oldRefreshToken
        );

        return saveTokensAndSendResponse(user, res, 200)
    } catch (error) {
        console.error("Refresh token error: ", error);
        return res.status(401).send(ResponseErrorMessage.INVALID_REFRESH_TOKEN);
    }
};

const logout = async (req: AuthRequest, res: Response) => {
    try {
        await userModel.updateOne({_id: req.user?._id}, {$set: {refreshTokens: []}});

        setTokens(res, {}, true)

        res.status(200).send();
    } catch (error) {
        console.error("Logout error: ", error);
        return res.status(500).send("Error logging out.");
    }
};

export default {
    register,
    login,
    refreshToken,
    logout
};
