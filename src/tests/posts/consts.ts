import type { PostInput } from "./types";

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
