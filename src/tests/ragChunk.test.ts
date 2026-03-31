import mongoose from "mongoose";
import ragChunksModel from "../models/ragChunksModel";
import ragChunkService from "../services/ragChunkService";
import { PostRagData } from "../types/post";
import initApp from "../index";

jest.mock("@xenova/transformers", () => ({
    pipeline: jest.fn().mockResolvedValue(
        jest.fn().mockImplementation((data: string) => {
            return Promise.resolve({
                data: [0.1, 0.2, 0.3, 0.4, 0.5],
            });
        })
    ),
}));

describe("RagChunkService", () => {
    beforeAll(async () => {
        await initApp();
    });

    beforeEach(async () => {
        await ragChunksModel.deleteMany({});
    });

    const mockPostId = new mongoose.Types.ObjectId();
    const mockPost: PostRagData = {
        _id: mockPostId,
        description: "This is a test description for the RAG chunk service. ".repeat(20),
    };

    describe("saveRagChunksForPost", () => {
        it("should chunk the description and save embeddings to the database", async () => {
            const savedChunks = await ragChunkService.saveRagChunksForPost(mockPost);

            expect(savedChunks.length).toBeGreaterThan(0);
            expect(savedChunks[0]).toMatchObject({
                postId: mockPostId,
                chunkIndex: 0,
                text: expect.any(String),
            });
            expect(savedChunks[0].embedding).toEqual(expect.arrayContaining([0.1, 0.2, 0.3, 0.4, 0.5]));
        });
    });

    describe("deleteRagChunksForPost", () => {
        it("should delete all chunks associated with a specific postId", async () => {
            await ragChunksModel.create({
                postId: mockPostId,
                embedding: [0.1, 0.2],
                chunkIndex: 0,
                text: "test chunk",
            });

            await ragChunkService.deleteRagChunksForPost(mockPostId);

            const savedChunks = await ragChunksModel.find({ postId: mockPostId });
            expect(savedChunks.length).toBe(0);
        });
    });

    describe("updateRagChunksForPost", () => {
        it("should delete existing chunks and save new ones", async () => {
            await ragChunksModel.create({
                postId: mockPostId,
                embedding: [0.9, 0.9],
                chunkIndex: 0,
                text: "old chunk",
            });

            const savedChunks = await ragChunkService.updateRagChunksForPost(mockPost);

            expect(savedChunks.length).toBeGreaterThan(0);
            expect(savedChunks[0].text).not.toBe("old chunk");
            expect(savedChunks[0].embedding).toEqual(expect.arrayContaining([0.1, 0.2, 0.3, 0.4, 0.5]));
        });
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });
});
