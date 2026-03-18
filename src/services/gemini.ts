import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const chatSession = genAI.chats.create({
  model: "gemini-3-flash-preview",
  config: {
    systemInstruction: SYSTEM_INSTRUCTION,
  },
});

export async function sendMessage(message: string) {
  try {
    const result = await chatSession.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    return "I'm sorry, I'm having a bit of trouble connecting right now. Please try again in a moment!";
  }
}
