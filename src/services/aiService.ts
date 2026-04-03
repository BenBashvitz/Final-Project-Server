import { RawPost } from "../types/post";
import envVar from "../configs/envVar";
import { GoogleGenerativeAI } from '@google/generative-ai'
import ragChunkService from "./ragChunkService";
import { RagChunkPageOptions } from "../types/ragChunks";

class AiService {
    private genAI: GoogleGenerativeAI = new GoogleGenerativeAI(envVar.GEMINI_API_KEY);
    private maxNumberOfRetries = envVar.RAG_MAX_NUMBER_OR_RETRIES;

    getRelevantPosts = async (userQuery: string): Promise<RawPost[]> => {
        return this.getRelevantPostsWithIterations([], userQuery, {
            retryCount: 0,
            nextId: null
        });
    }

    private getRelevantPostsWithIterations = async (previousRelevantPosts: RawPost[], userQuery: string, options: RagChunkPageOptions): Promise<RawPost[]> => {
        if (options.retryCount === this.maxNumberOfRetries || (options.retryCount > 0 && options.nextId === null)) return previousRelevantPosts;

        const { posts, nextRagChunkId } = await ragChunkService.topKPostsByQuery(userQuery, options);

        const prompt = `
            User Query: "${userQuery}"
            Return ONLY a JSON array of indices for relevant posts.
            Posts:
            ${posts.map((post, i) => `[Index: ${i}] The post description: ${post.description}`).join("\n")}
        `;

        try {
            const indices = await this.callGemini(prompt);

            previousRelevantPosts = previousRelevantPosts.concat(this.filterPostsByRelevantPostIndices(previousRelevantPosts, posts, indices));

            if (previousRelevantPosts.length >= envVar.MINIMUM_RELEVANT_POSTS) return previousRelevantPosts;

            return this.getRelevantPostsWithIterations(previousRelevantPosts, userQuery, {
                retryCount: options.retryCount + 1,
                nextId: nextRagChunkId
            });
        } catch (error) {
            console.warn("Gemini failed. Switching to Local Model (LM Studio)...", error);
        }

        try {
            const indices = await this.callLMStudio(prompt);
            previousRelevantPosts = previousRelevantPosts.concat(this.filterPostsByRelevantPostIndices(previousRelevantPosts, posts, indices));

            if (previousRelevantPosts.length >= envVar.MINIMUM_RELEVANT_POSTS) return previousRelevantPosts;

            return this.getRelevantPostsWithIterations(previousRelevantPosts, userQuery, {
                nextId: nextRagChunkId,
                retryCount: options.retryCount + 1
            });
        } catch (error) {
            if (previousRelevantPosts.length > 0) {
                console.error("All LLM providers failed. Returning relevant posts", error);

                return previousRelevantPosts;
            }

            console.error("All LLM providers failed. Returning original results as fallback. ", error);

            return posts;
        }
    }

    private filterPostsByRelevantPostIndices(previousPosts: RawPost[], posts: RawPost[], indices: number[]): RawPost[] {
        if (!Array.isArray(indices)) {
            console.error("The result from the LLM provider is not an array")
            return posts;
        }

        const filteredPosts: RawPost[] = []

        indices.forEach(index => {
            if (posts[index] && !previousPosts.includes(posts[index])) filteredPosts.push(posts[index])
        })

        return filteredPosts;
    }

    private async callGemini(prompt: string): Promise<number[]> {
        const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanedJson = text.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanedJson);
    }

    private async callLMStudio(prompt: string): Promise<number[]> {
        const response = await fetch(`${envVar.LM_STUDIO_URL}/v1/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "local-model",
                messages: [{ role: "user", content: prompt }],
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