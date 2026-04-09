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
jest.mock("../models/postModel", () => ({
    find: jest.fn()
}));

global.fetch = jest.fn() as jest.Mock;

import aiService from "../services/aiService";
import ragChunkService from "../services/ragChunkService";
import postModel from "../models/postModel";

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

    const mockTopKRagChunks = {
        ragChunks: [{
            postId: mockPost._id,
            chunkIndex: 0,
            text: "A test post description about cats",
            embedding: [0.1, 0.2]
        }],
        nextId: null
    };

    const mockTopKPosts = [mockPost];

    beforeEach(() => {
        jest.clearAllMocks();
        mockGenerateContent.mockReset();
        (postModel.find as jest.Mock).mockResolvedValue(mockTopKPosts);
    });

    describe("getRelevantPosts", () => {
        it("should return relevant posts when Gemini succeeds", async () => {
            (ragChunkService.topKRagChunksByQuery as jest.Mock).mockResolvedValue(mockTopKRagChunks);
            mockGenerateContent.mockResolvedValue({
                response: {
                    text: () => "```json [0] ```",
                },
            });

            const result = await aiService.getRelevantPosts("Give me cat posts");

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(mockPost);
            expect(ragChunkService.topKRagChunksByQuery).toHaveBeenCalledWith("Give me cat posts", null);
            expect(mockGenerateContent).toHaveBeenCalled();
        });

        it("should fallback to LM Studio if Gemini fails", async () => {
            (ragChunkService.topKRagChunksByQuery as jest.Mock).mockResolvedValue(mockTopKRagChunks);

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

        it("should fallback to original topK chunks and then return posts if both LLMs fail", async () => {
            (ragChunkService.topKRagChunksByQuery as jest.Mock).mockResolvedValue(mockTopKRagChunks);

            mockGenerateContent.mockRejectedValue(new Error("Gemini Error"));
            (global.fetch as jest.Mock).mockRejectedValue(new Error("LM Studio Error"));

            const result = await aiService.getRelevantPosts("Cat query");

            expect(result).toEqual(mockTopKPosts);
        });

        it("should iterate if minimum relevant posts count is not reached", async () => {
            (ragChunkService.topKRagChunksByQuery as jest.Mock)
                .mockResolvedValueOnce({ ...mockTopKRagChunks, nextId: new mongoose.Types.ObjectId() })
                .mockResolvedValueOnce(mockTopKRagChunks);

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
            (ragChunkService.topKRagChunksByQuery as jest.Mock).mockResolvedValue(mockTopKRagChunks);
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
