import { PipelineStage } from "mongoose";

export const DEFAULT_JWT_EXPIRATION_TIME_SECONDS = 3600;
export const DEFAULT_REFRESH_JWT_EXPIRATION_TIME_SECONDS = 86400;
export const DEFAULT_POSTS_PAGE_SIZE = 10;
export const INVALID_CURSOR_ERROR_MESSAGE = "Invalid cursor format";
export const UPLOADS_ROUTE = "uploads";

export const USER_LOOKUP_PIPELINE_STAGE: PipelineStage[] = [
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "user",
      pipeline: [{ $project: { _id: 1, username: 1, imgUrl: 1 } }],
    },
  },
  { $unwind: "$user" },
];
