import mongoose from "mongoose";

const mockGenerateContent = jest.fn();

jest.mock("@xenova/transformers", () => ({
    pipeline: jest.fn().mockResolvedValue(jest.fn()),
}));

jest.mock("@google/generative-ai", () => {
    return {
        GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
            getGenerativeModel: jest.fn().mockReturnValue({
                generateContent: (...args: any[]) => mockGenerateContent(...args),
            }),
        })),
    };
});

jest.mock("../services/ragChunkService");

global.fetch = jest.fn() as jest.Mock;

import aiService from "../services/aiService";
import ragChunkService from "../services/ragChunkService";

describe("AiService", () => {
    const mockPost = {
        _id: new mongoose.Types.ObjectId(),
        description: "A test post description about cats",
        imgUrl: "cats.jpg",
        userId: new mongoose.Types.ObjectId(),
        likeCount: 5,
        commentCount: 2,
        creationDate: new Date(),
    };

    const mockTopKPosts = [mockPost];

    beforeEach(() => {
        jest.clearAllMocks();
        mockGenerateContent.mockReset();
    });

    describe("getRelevantPosts", () => {
        it("should return relevant posts when Gemini succeeds", async () => {
            (ragChunkService.topKPostsByQuery as jest.Mock).mockResolvedValue(mockTopKPosts);
            mockGenerateContent.mockResolvedValue({
                response: {
                    text: () => "```json [0] ```",
                },
            });

            const result = await aiService.getRelevantPosts("Give me cat posts");

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(mockPost);
            expect(ragChunkService.topKPostsByQuery).toHaveBeenCalledWith("Give me cat posts");
            expect(mockGenerateContent).toHaveBeenCalled();
        });

        it("should fallback to LM Studio if Gemini fails", async () => {
            (ragChunkService.topKPostsByQuery as jest.Mock).mockResolvedValue(mockTopKPosts);

            mockGenerateContent.mockRejectedValue(new Error("Gemini Error"));

            (global.fetch as jest.Mock).mockResolvedValue({
                json: jest.fn().mockResolvedValue({
                    choices: [{ message: { content: "```json [0] ```" } }]
                })
            });

            const result = await aiService.getRelevantPosts("Cat query");

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(mockPost);
            expect(global.fetch).toHaveBeenCalled();
        });

        it("should fallback to original topKPosts if both LLMs fail", async () => {
            (ragChunkService.topKPostsByQuery as jest.Mock).mockResolvedValue(mockTopKPosts);

            mockGenerateContent.mockRejectedValue(new Error("Gemini Error"));
            (global.fetch as jest.Mock).mockRejectedValue(new Error("LM Studio Error"));

            const result = await aiService.getRelevantPosts("Cat query");

            expect(result).toEqual(mockTopKPosts);
        });

        it("should iterate if minimum relevant posts count is not reached", async () => {
            (ragChunkService.topKPostsByQuery as jest.Mock).mockResolvedValue(mockTopKPosts);

            mockGenerateContent
                .mockResolvedValueOnce({
                    response: { text: () => "[]" }
                })
                .mockResolvedValueOnce({
                    response: { text: () => "[0]" }
                });

            const result = await aiService.getRelevantPosts("Cat query");

            expect(result).toHaveLength(1);
            expect(mockGenerateContent).toHaveBeenCalledTimes(2);
        });

        it("should handle invalid JSON from Gemini by falling back to Local Model", async () => {
            (ragChunkService.topKPostsByQuery as jest.Mock).mockResolvedValue(mockTopKPosts);
            mockGenerateContent.mockResolvedValue({
                response: { text: () => "Not a JSON" }
            });

            (global.fetch as jest.Mock).mockResolvedValue({
                json: jest.fn().mockResolvedValue({
                    choices: [{ message: { content: "[0]" } }]
                })
            });

            const result = await aiService.getRelevantPosts("query");

            expect(result).toHaveLength(1);
        });
    });
});
