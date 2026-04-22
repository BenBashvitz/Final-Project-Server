import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

jest.mock("@xenova/transformers", () => ({
  pipeline: jest.fn().mockResolvedValue(
    jest.fn().mockImplementation((data: string) => {
      return Promise.resolve({
        data: [0.1, 0.2, 0.3, 0.4, 0.5],
      });
    }),
  ),
}));
