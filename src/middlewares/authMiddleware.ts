import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../types/request";
import type { TokenPayload } from "../types/token";
import config from "../configs/envVar";
import { AccessTokenSchema } from "../schemas/auth";
import z, { ZodError } from "zod";

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { accessToken } = AccessTokenSchema.parse(req.cookies);
    const jwtSecret = config.JWT_SECRET;

    const payload = jwt.verify(accessToken, jwtSecret) as TokenPayload;

    req.user = { _id: payload.userId };

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(401).send(z.treeifyError(error));
    }

    return res.status(401).send("Unauthorized");
  }
};
