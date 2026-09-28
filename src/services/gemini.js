import { GoogleGenAI } from "@google/genai";
import { config } from "../config/env.js";
const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
let client = null;
export function geminiReady() { return Boolean(process.env.GEMINI_API_KEY); }
export async function askGemini({ prompt, system, history = [] }) {
  if (!geminiReady()) throw new Error("GEMINI_API_KEY is not configured");
  client ||= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const contents = [];
  for (const item of history.slice(-12)) {
    contents.push({ role: item.role === "assistant" ? "model" : "user", parts: [{ text: String(item.text || "") }] });
  }
  contents.push({ role: "user", parts: [{ text: String(prompt || "") }] });
  const response = await client.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: system || "You are KING AI, an institutional trading research assistant. Explain market structure, risk, analytics and system behavior clearly. Never claim guaranteed returns and never place trades. Separate facts from hypotheses."
    }
  });
  return { text: response.text || "", model };
}
