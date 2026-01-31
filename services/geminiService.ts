
import { GoogleGenAI, Type } from "@google/genai";
import { QuestionType, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateQuestionsFromTopic = async (topic: string, lang: Language, count: number = 3) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate ${count} professional academic questions about the topic: ${topic}. 
    Strict Rules:
    1. Language: All text MUST be in ${lang === Language.AR ? 'Arabic' : 'English'}.
    2. Question Types: Mix of multiple_choice and true_false.
    3. Multiple Choice: MUST have EXACTLY 5 options.
    4. Data Structure: Return an array of objects.
    5. Scoring: Assign 1 or 2 points based on difficulty.
    6. Timing: Assign 30 to 60 seconds per question.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            type: { type: Type.STRING, description: 'multiple_choice or true_false' },
            points: { type: Type.NUMBER },
            timeLimit: { type: Type.NUMBER, description: 'Seconds allowed' },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  isCorrect: { type: Type.BOOLEAN }
                },
                required: ['text', 'isCorrect']
              }
            },
            correctAnswer: { type: Type.STRING, description: 'Only for true_false: "true" or "false"' }
          },
          required: ['text', 'type', 'points', 'timeLimit']
        }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("AI Generation Error", e);
    return [];
  }
};
