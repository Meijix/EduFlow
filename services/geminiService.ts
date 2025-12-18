
import { GoogleGenAI, Type } from "@google/genai";
import { StudyPlanResponse, QuizQuestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateStudyPlan = async (subject: string): Promise<StudyPlanResponse> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Crea un plan de estudio estructurado para el tema: "${subject}". 
    Proporciona una descripción general y una lista de 5 a 8 temas clave para dominar esta área.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          areaName: { type: Type.STRING },
          description: { type: Type.STRING },
          recommendedTopics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["title", "description"]
            }
          }
        },
        required: ["areaName", "description", "recommendedTopics"]
      }
    }
  });

  return JSON.parse(response.text || '{}') as StudyPlanResponse;
};

export const generateQuiz = async (topicTitle: string, notes: string): Promise<QuizQuestion[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Genera un cuestionario de 5 preguntas de opción múltiple basado en el siguiente tema: "${topicTitle}". 
    Usa estas notas como contexto si es posible: "${notes}". 
    Asegúrate de que haya una sola respuesta correcta por pregunta.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            correctAnswerIndex: { type: Type.INTEGER }
          },
          required: ["question", "options", "correctAnswerIndex"]
        }
      }
    }
  });

  return JSON.parse(response.text || '[]') as QuizQuestion[];
};

export const getAITutorExplanation = async (topic: string, question: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Actúa como un tutor experto en ${topic}. Explica de forma clara y pedagógica lo siguiente: ${question}`,
  });
  return response.text;
};
