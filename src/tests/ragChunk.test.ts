import mongoose from "mongoose";
import ragChunksModel from "../models/ragChunksModel";
import postModel from "../models/postModel";
import ragChunkService from "../services/ragChunkService";
import { PostRagData, RawPost } from "../types/post";
import initApp from "../index";
import envVar from "../configs/envVar";
import { setupMultipleUsersForTests, setupSameUserPosts } from "./utils";
import { Tokens } from "../types/token";

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
    let userIds: string[];
    let userTokens: Tokens[];
    beforeAll(async () => {
        const app = await initApp();
        const userData = await setupMultipleUsersForTests(app);
        userIds = userData.userIds;
        userTokens = userData.userTokens;
    });

    beforeEach(async () => {
        await ragChunksModel.deleteMany({});
        await postModel.deleteMany({});
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

    describe("topKPostsByQuery", () => {
        let posts: RawPost[]

        beforeEach(async () => {
            posts = await setupSameUserPosts(userIds[0])
        })

        it("should retrieve top K relevant posts based on the query", async () => {
            await ragChunksModel.create({
                postId: posts[0]._id,
                embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
                chunkIndex: 0,
                text: "Post 1 chunk",
            });

            await ragChunksModel.create({
                postId: posts[1]._id,
                embedding: [-0.1, -0.2, -0.3, -0.4, -0.5],
                chunkIndex: 0,
                text: "Post 2 chunk",
            });

            const { posts: topPosts } = await ragChunkService.topKPostsByQuery("test query", {
                retryCount: 0,
                nextId: null
            });

            expect(topPosts.length).toBe(1);
            expect(topPosts[0]._id.toString()).toBe(posts[0]._id.toString());
        });

        it("should limit results to RAG_TOP_K distinct posts and avoid duplicates", async () => {
            await ragChunksModel.create({
                postId: posts[0]._id,
                embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
                chunkIndex: 0,
                text: "Post 0 chunk 1",
            });
            await ragChunksModel.create({
                postId: posts[0]._id,
                embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
                chunkIndex: 1,
                text: "Post 0 chunk 2",
            });

            for (let i = 1; i <= 6; i++) {
                await ragChunksModel.create({
                    postId: posts[i]._id,
                    embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
                    chunkIndex: 0,
                    text: `Post ${i} chunk`,
                });
            }

            const { posts: topPosts } = await ragChunkService.topKPostsByQuery("test query", {
                retryCount: 0,
                nextId: null,
            });

            expect(topPosts.length).toBe(envVar.RAG_TOP_K);

            const uniqueIds = new Set(topPosts.map(p => p._id.toString()));
            expect(uniqueIds.size).toBe(envVar.RAG_TOP_K);
        });
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });
});
