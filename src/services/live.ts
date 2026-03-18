import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { getEnhancedSystemInstruction } from "./knowledge";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface LiveSessionCallbacks {
  onAudioData: (base64Audio: string) => void;
  onInterrupted: () => void;
  onTranscription: (text: string, isUser: boolean) => void;
  onError: (error: any) => void;
  onClose: () => void;
}

export class GeminiLiveSession {
  private session: any = null;
  private callbacks: LiveSessionCallbacks;

  constructor(callbacks: LiveSessionCallbacks) {
    this.callbacks = callbacks;
  }

  async connect() {
    try {
      const instruction = await getEnhancedSystemInstruction();
      this.session = await genAI.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
          },
          systemInstruction: instruction,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.log("Live session opened");
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                  this.callbacks.onAudioData(part.inlineData.data);
                }
                if (part.text) {
                  this.callbacks.onTranscription(part.text, false);
                }
              }
            }

            if (message.serverContent?.interrupted) {
              this.callbacks.onInterrupted();
            }

            // Handle user transcription
            if (message.serverContent?.inputTranscription) {
              this.callbacks.onTranscription(message.serverContent.inputTranscription.text || "", true);
            }
          },
          onerror: (error) => {
            console.error("Live session error:", error);
            this.callbacks.onError(error);
          },
          onclose: () => {
            console.log("Live session closed");
            this.callbacks.onClose();
          },
        },
      });
    } catch (error) {
      console.error("Failed to connect to Live API:", error);
      throw error;
    }
  }

  sendAudio(base64Data: string) {
    if (this.session) {
      this.session.sendRealtimeInput({
        media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
      });
    }
  }

  close() {
    if (this.session) {
      this.session.close();
      this.session = null;
    }
  }
}
