import {Post, RawPost} from "../types/post";
import {FeatureExtractionPipeline, pipeline} from "@xenova/transformers";
import envVar from "../configs/envVar";
import {GoogleGenerativeAI} from '@google/generative-ai'

class AiService {
    private textEmbedder: FeatureExtractionPipeline | null = null;
    private genAI: GoogleGenerativeAI = new GoogleGenerativeAI(envVar.GEMINI_API_KEY);

    getTextVector = async (description: string): Promise<number[]> => {
        if (!this.textEmbedder) {
            this.textEmbedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        }

        const textOutput = await this.textEmbedder(description, {
            pooling: 'mean',
            normalize: true,
        });

        return Array.from(textOutput.data);
    }

    verifyPostsWithLLM = async (posts: RawPost[], userQuery: string): Promise<RawPost[]> => {
        if (!posts.length) return [];

        const prompt = `
            User Query: "${userQuery}"
            Return ONLY a JSON array of indices for relevant posts.
            Posts:
            ${posts.map((post, i) => `[Index: ${i}] ${post.description}`).join("\n")}
        `;

        try {
            const indices = await this.callGemini(prompt);
            return this.filterPosts(posts, indices);
        } catch (error) {
            console.warn("Gemini failed. Switching to Local Model (LM Studio)...", error.message);
        }

        try {
            const indices = await this.callLMStudio(prompt);
            return this.filterPosts(posts, indices);
        } catch (error) {
            console.error("All LLM providers failed. Returning original results as fallback.");
            return posts;
        }
    }

    private filterPosts(posts: Post[], indices: number[]) {
        if (!Array.isArray(indices)) return posts;
        return posts.filter((_, index) => indices.includes(index));
    }

    private async callGemini(prompt: string) {
        const model = this.genAI.getGenerativeModel({model: "gemini-1.5-flash"});
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanedJson = text.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanedJson);
    }

    private async callLMStudio(prompt: string) {
        const response = await fetch(`${envVar.LM_STUDIO_URL}/chat/completions`, {
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