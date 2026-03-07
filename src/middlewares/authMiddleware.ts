import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, UserReq } from "../types/request";

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authorizationHeader = req.headers.authorization;
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT configuration error.");
  }

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authorizationHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as UserReq;

    req.user = { _id: payload.userId };

    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
};
