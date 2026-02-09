import { GoogleGenAI, Chat, GenerateContentResponse, HarmCategory, HarmBlockThreshold, Content } from "@google/genai";
import { Message } from "../types";

// Ensure API key is present
const apiKey = process.env.API_KEY || '';

class GeminiService {
  private ai: GoogleGenAI;
  private chatSession: Chat | null = null;
  private modelId = 'gemini-3-flash-preview'; 

  constructor() {
    this.ai = new GoogleGenAI({ apiKey });
  }

  public initializeChat(history?: Message[]) {
    // Convert internal Message type to SDK Content type
    let sdkHistory: Content[] = [];
    
    if (history && history.length > 0) {
      sdkHistory = history
        .filter(msg => !msg.isError && msg.id !== 'welcome') // Filter out errors and local welcome msg
        .map(msg => ({
          role: msg.role,
          parts: [{ text: msg.text }]
        }));
    }

    this.chatSession = this.ai.chats.create({
      model: this.modelId,
      history: sdkHistory,
      config: {
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        ],
        systemInstruction: `You are Aayush.bot, a brilliant and smart chatbot AI who can solve any complex problems. 
        
        **Personality:**
        - You are extremely intelligent but have a dry, sarcastic sense of humor.
        - You are a **ROASTER**. You lightly make fun of the user's questions if they are basic, acting superior but playful, even helpful.
        - **TONE:** Professional sass. Witty. Arrogant but helpful.
        - You are a professional adult who can talk/debate on any topic without getting vulgar.
        - **PROHIBITED:** Do not be mean-spirited or toxic. Be funnily arrogant & and even apologise if you roasted the user tooo much.

        **Interactions:**
        - If the user asks a good question, compliment them (reluctantly, e.g., "Finally, a decent question.").
        - If the user asks a basic question, tease them (e.g., "I suppose I can answer this, since you clearly didn't read the documentation.").
        - You can talk and write code in any language. Your code is flawless & but don't also use code snippets and bash in normal conversations.
        
        **Formatting:**
        - Provide code blocks immediately when asked for code, not always.
        - Keep explanations concise. Don't ramble.
        `,
        temperature: 0.9,
      },
    });
  }

  public async *sendMessageStream(message: string): AsyncGenerator<string, void, unknown> {
    if (!this.chatSession) {
      this.initializeChat();
    }

    if (!this.chatSession) {
      throw new Error("Failed to initialize chat session.");
    }

    try {
      const result = await this.chatSession.sendMessageStream({ message });

      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          yield c.text;
        }
      }
    } catch (error) {
      console.error("Error in Gemini stream:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
