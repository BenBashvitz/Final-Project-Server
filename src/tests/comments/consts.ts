import { CommentInput } from "./types";

const currentTime = Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;

export const COMMENTS: CommentInput[] = [
  {
    message: "Test Comment",
    creationDate: new Date(currentTime).toISOString(),
  },
  {
    message: "Another Comment",
    creationDate: new Date(currentTime - 1 * DAY_MS).toISOString(),
  },
];
