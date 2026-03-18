import { GoogleGenAI, Type, FunctionDeclaration, Modality, Chat } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { getEnhancedSystemInstruction } from "./knowledge";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const placeOrderFunctionDeclaration: FunctionDeclaration = {
  name: "placeOrder",
  parameters: {
    type: Type.OBJECT,
    description: "Place a food order for the user.",
    properties: {
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "The name of the food item." },
            quantity: { type: Type.INTEGER, description: "The quantity of the item." },
            price: { type: Type.NUMBER, description: "The unit price of the item." }
          },
          required: ["name", "quantity", "price"]
        },
        description: "The list of items in the order."
      },
      total: { type: Type.NUMBER, description: "The total cost of the order." },
      deliveryAddress: { type: Type.STRING, description: "The delivery address for the order." },
      paymentMethod: { type: Type.STRING, enum: ["transfer", "pos", "cash"], description: "The payment method chosen." }
    },
    required: ["items", "total", "paymentMethod"]
  }
};

let chatSession: Chat | null = null;

async function getChatSession() {
  if (chatSession) return chatSession;
  
  const instruction = await getEnhancedSystemInstruction();
  chatSession = genAI.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: instruction,
      tools: [{ functionDeclarations: [placeOrderFunctionDeclaration] }]
    },
  });
  return chatSession;
}

export async function sendMessage(message: string) {
  try {
    const session = await getChatSession();
    const result = await session.sendMessage({ message });
    return result;
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    throw error;
  }
}

export async function sendMessageStream(message: string) {
  try {
    const session = await getChatSession();
    const result = await session.sendMessageStream({ message });
    return result;
  } catch (error) {
    console.error("Error sending message stream to Gemini:", error);
    throw error;
  }
}

export async function generateSpeech(text: string) {
  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return `data:audio/mp3;base64,${base64Audio}`;
    }
    return null;
  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
}

export async function generateImage(prompt: string) {
  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
}

export async function startVideoGeneration(prompt: string) {
  try {
    let operation = await genAI.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });
    return operation;
  } catch (error) {
    console.error("Error starting video generation:", error);
    throw error;
  }
}

export async function pollVideoOperation(operation: any) {
  try {
    return await genAI.operations.getVideosOperation({ operation });
  } catch (error) {
    console.error("Error polling video operation:", error);
    throw error;
  }
}

export async function fetchVideoData(downloadLink: string) {
  try {
    const response = await fetch(downloadLink, {
      method: 'GET',
      headers: {
        'x-goog-api-key': process.env.GEMINI_API_KEY || "",
      },
    });
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Error fetching video data:", error);
    return null;
  }
}
