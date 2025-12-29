
import { GoogleGenAI, Type } from "@google/genai";
import { DJ_PROMPT } from "../constants";

export const askRadioDJ = async (userMessage: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userMessage,
      config: {
        systemInstruction: DJ_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { 
              type: Type.STRING, 
              description: "O texto de resposta amigável do DJ" 
            },
            searchTags: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Lista de tags curtas para buscar estações (ex: jazz, rock)"
            }
          },
          required: ["reply", "searchTags"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result;
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      reply: "Desculpe, meu radar de DJ está com interferência agora. Tente novamente em um instante!",
      searchTags: []
    };
  }
};
