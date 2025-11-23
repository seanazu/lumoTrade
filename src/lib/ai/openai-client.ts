import { OpenAI } from "openai";

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Model configuration
export const AI_CONFIG = {
  model: "chatgpt-5.1",
  maxOutputTokens: 1000,
};

// Validate API key
export function validateOpenAIKey() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set in environment variables");
  }
}
