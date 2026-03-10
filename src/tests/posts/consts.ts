import type { PostInput } from "./types";

const currentDate = new Date();

export const POSTS: PostInput[] = [
  {
    description: "Test Description1",
    imgUrl: "https://example.com/image.jpg",
    creationDate: currentDate.toISOString(),
  },
  {
    description: "Another Description2",
    imgUrl: "https://example.com/image2.jpg",
    creationDate: new Date(
      currentDate.setDate(currentDate.getDate() - 1),
    ).toISOString(),
  },
  {
    description: "Test Description3",
    imgUrl: "https://example.com/image3.jpg",
    creationDate: new Date(
      currentDate.setDate(currentDate.getDate() - 2),
    ).toISOString(),
  },
  {
    description: "Another Description4",
    imgUrl: "https://example.com/image4.jpg",
    creationDate: new Date(
      currentDate.setDate(currentDate.getDate() - 3),
    ).toISOString(),
  },
];
