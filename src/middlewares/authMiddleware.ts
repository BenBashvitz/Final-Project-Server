import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../types/request";
import type {TokenPayload} from "../types/token";
import {accessTokenCookieName} from "../consts";
import config from '../config';

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const accessToken = req.cookies[accessTokenCookieName];
  const jwtSecret = config.JWT_SECRET;

  if (!accessToken) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const payload = jwt.verify(accessToken, jwtSecret) as TokenPayload;

    req.user = { _id: payload.userId };

    next();
  } catch {
    return res.status(401).send("Unauthorized");
  }
};
