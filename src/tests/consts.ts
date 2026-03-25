import type { UserInput } from "../types/user";
import type { CommentInput, PostInput } from "./types";

export const USERS: UserInput[] = [
  {
    email: "example1@example.com",
    username: "example1User",
    password: "example1Pass",
  },
  {
    email: "example2@example.com",
    username: "example2User",
    password: "example2Pass",
  },
  {
    email: "example3@example.com",
    username: "example3User",
    password: "example3Pass",
  },
  {
    email: "example4@example.com",
    username: "example4User",
    password: "example4Pass",
  },
];

const currentTime = Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;

export const POSTS: PostInput[] = [
  {
    description: "Test Description1",
    imgUrl: "https://example.com/image.jpg",
    creationDate: new Date(currentTime).toISOString(),
  },
  {
    description: "Another Description2",
    imgUrl: "https://example.com/image2.jpg",
    creationDate: new Date(currentTime - 1 * DAY_MS).toISOString(),
  },
  {
    description: "Test Description3",
    imgUrl: "https://example.com/image3.jpg",
    creationDate: new Date(currentTime - 2 * DAY_MS).toISOString(),
  },
  {
    description: "Another Description4",
    imgUrl: "https://example.com/image4.jpg",
    creationDate: new Date(currentTime - 3 * DAY_MS).toISOString(),
  },
];

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
