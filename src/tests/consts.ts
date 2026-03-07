import { PostInput } from "../types/post";
import { UserInput } from "../types/user";

export const POSTS: PostInput[] = [
  {
    description: "Test Description",
    imgUrl: "https://example.com/image.jpg",
  },
  {
    description: "Another Description",
    imgUrl: "https://example.com/image2.jpg",
  },
];

export const USERS: UserInput[] = [
  {
    email: "example1@example.com",
    username: "example1User",
    password: "example1Pass",
    refreshTokens: [],
  },
  {
    email: "example2@example.com",
    username: "example2User",
    password: "example2Pass",
    refreshTokens: [],
  },
];
