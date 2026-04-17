import {RawPost} from "../types/post";
import envVar from "../configs/envVar";
import {GoogleGenerativeAI} from '@google/generative-ai'
import ragChunkService from "./ragChunkService";
import mongoose from "mongoose";
import {RawRagChunk} from "../types/ragChunks";

class AiService {
    private genAI: GoogleGenerativeAI = new GoogleGenerativeAI(envVar.GEMINI_API_KEY);
    private maxNumberOfRetries = envVar.RAG_MAX_NUMBER_OR_RETRIES;

    getRelevantPostsIds = async (userQuery: string): Promise<mongoose.Types.ObjectId[]> => {
        const relevantRagChunks = await this.getRelevantRagChunksWithIterations([], userQuery, null, 0,);

        return relevantRagChunks.map(({postId}) => postId)
    }

    private getRelevantRagChunksWithIterations = async (previousRagChunks: RawRagChunk[], userQuery: string, nextId: mongoose.Types.ObjectId | null, retryCount = 3): Promise<RawRagChunk[]> => {
        if (retryCount === this.maxNumberOfRetries || (retryCount > 0 && nextId === null)) return previousRagChunks;

        const {ragChunks, nextId: nextRagChunkId} = await ragChunkService.topKRagChunksByQuery(userQuery, nextId);

        const prompt = `
            User Query: "${userQuery}"
            Return ONLY a JSON array of indices for relevant post chunks.
            Post chunks:
            ${ragChunks.map((chunk, i) => `[Index: ${i}] The chunk description: ${chunk.text}`).join("\n")}
        `;

        try {
            return await this.getRelevantRagChunksFromProvider(
                previousRagChunks,
                ragChunks,
                nextRagChunkId,
                retryCount,
                userQuery,
                prompt,
                this.callGemini
            )
        } catch (error) {
            console.warn("Gemini failed. Switching to Local Model (LM Studio)...", error);
        }

        try {
            return await this.getRelevantRagChunksFromProvider(
                previousRagChunks,
                ragChunks,
                nextRagChunkId,
                retryCount,
                userQuery,
                prompt,
                this.callLMStudio
            )
        } catch (error) {
            if (previousRagChunks.length > 0) {
                console.error("All LLM providers failed. Returning relevant posts", error);

                return previousRagChunks;
            }

            console.error("All LLM providers failed. Returning original results as fallback. ", error);

            return ragChunks;
        }
    }

    private getRelevantRagChunksFromProvider = async (previousRagChunks: RawRagChunk[], ragChunks: RawRagChunk[], nextRagChunkId: mongoose.Types.ObjectId | null, retryCount: number, userQuery: string, prompt: string, callProvider: (prompt: string) => Promise<number[]>) => {
        const indices = await callProvider(prompt);
        previousRagChunks = previousRagChunks.concat(this.filterRagChunksByRelevantIndices(ragChunks, indices));

        if (previousRagChunks.length >= envVar.MINIMUM_RELEVANT_POSTS) return previousRagChunks;

        return this.getRelevantRagChunksWithIterations(previousRagChunks, userQuery, nextRagChunkId, retryCount + 1);
    }

    private filterRagChunksByRelevantIndices = (ragChunks: RawRagChunk[], indices: number[]): RawRagChunk[] => {
        if (!Array.isArray(indices)) {
            console.error("The result from the LLM provider is not an array")
            return ragChunks;
        }

        return indices.reduce<RawRagChunk[]>((filteredRagChunks, index) => {
            if (ragChunks[index]) filteredRagChunks.push(ragChunks[index]);

            return filteredRagChunks;
        }, []);
    }

    private callGemini = async (prompt: string): Promise<number[]> => {
        const model = this.genAI.getGenerativeModel({model: "gemini-2.5-flash"});
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanedJson = text.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanedJson);
    }

    private callLMStudio = async (prompt: string): Promise<number[]> => {
        const response = await fetch(`${envVar.LM_STUDIO_URL}/v1/chat/completions`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                model: "local-model",
                messages: [{role: "user", content: prompt}],
                temperature: 0,
            }),
        });
        const data = await response.json();
        const text = data.choices[0].message.content;
        const cleanedJson = text.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanedJson);
    }
}

export default new AiService();