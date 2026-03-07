import bcrypt from "bcrypt";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel";
import { Tokens } from "../types/token";
import {
  DEFAULT_JWT_EXPIRATION_TIME_SECONDS,
  DEFAULT_REFRESH_JWT_EXPIRATION_TIME_SECONDS,
} from "../consts";
import { AuthRequest, UserReq } from "../types/request";

const generateTokens = (userId: string): Tokens => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpirationTimeSeconds =
    process.env.JWT_EXPIRATION_TIME_SECONDS ??
    DEFAULT_JWT_EXPIRATION_TIME_SECONDS;

  const refreshJwtExpirationTimeSeconds =
    process.env.REFRESH_JWT_EXPIRATION_TIME_SECONDS ??
    DEFAULT_REFRESH_JWT_EXPIRATION_TIME_SECONDS;

  if (!jwtSecret) {
    throw new Error("JWT configuration error.");
  }

  const token = jwt.sign({ userId }, jwtSecret, {
    expiresIn: +jwtExpirationTimeSeconds,
  });

  const refreshToken = jwt.sign({ userId }, jwtSecret, {
    expiresIn: +refreshJwtExpirationTimeSeconds,
  });

  return { token, refreshToken };
};

const register = async (req: Request, res: Response) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).send("email, password and username are required.");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  try {
    const user = await userModel.create({
      email,
      password: hashedPassword,
      username,
    });

    const tokens = generateTokens(user._id.toString());

    user.refreshTokens.push(tokens.refreshToken);
    await user.save();

    return res.status(201).json(tokens);
  } catch (error) {
    console.error("Register error: ", error);

    return res.status(500).send("Error creating user.");
  }
};

const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("email and password are required.");
  }

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(401).send("Invalid email or password.");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).send("Invalid email or password.");
    }

    const tokens = generateTokens(user._id.toString());

    user.refreshTokens.push(tokens.refreshToken);
    await user.save();

    return res.status(200).json(tokens);
  } catch (error) {
    console.error("Login error: ", error);

    return res.status(500).send("Error logging in.");
  }
};

const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken: oldRefreshToken } = req.body;
  const jwtSecret = process.env.JWT_SECRET ?? "";

  if (!oldRefreshToken) {
    return res.status(400).send("refreshToken is required.");
  }

  try {
    const decodedRefreshToken = jwt.verify(
      oldRefreshToken,
      jwtSecret,
    ) as UserReq;

    const user = await userModel.findById(decodedRefreshToken.userId);

    if (!user) {
      return res.status(401).send("Invalid refresh token.");
    }

    if (!user.refreshTokens.includes(oldRefreshToken)) {
      user.refreshTokens = [];
      await user.save();

      return res.status(401).send("Invalid refresh token.");
    }

    user.refreshTokens = user.refreshTokens.filter(
      (refreshToken) => refreshToken !== oldRefreshToken,
    );

    const tokens = generateTokens(user._id.toString());

    user.refreshTokens.push(tokens.refreshToken);

    await user.save();

    res.status(200).json(tokens);
  } catch (error) {
    console.error("Refresh token error: ", error);
    return res.status(401).send("Invalid refresh token");
  }
};

const logout = async (req: AuthRequest, res: Response) => {
  try {
    await userModel.updateOne(
      { _id: req.user?._id },
      { $set: { refreshTokens: [] } },
    );

    res.status(200).json({
      refreshToken: null,
      token: null,
    });
  } catch (error) {
    console.error("Logout error: ", error);
    return res.status(500).send("Error logging out.");
  }
};

export default {
  register,
  login,
  refreshToken,
  logout,
};
