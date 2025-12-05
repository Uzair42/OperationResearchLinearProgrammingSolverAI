import { GoogleGenAI, Type } from "@google/genai";
import { LPProblem, OptimizationType, ConstraintSign } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ["MAXIMIZE", "MINIMIZE"] },
    variables: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of variable names found, e.g. ['x1', 'x2']"
    },
    objectiveCoefficients: {
      type: Type.ARRAY,
      items: { type: Type.NUMBER },
      description: "Coefficients corresponding to the variables array order."
    },
    constraints: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          coefficients: { type: Type.ARRAY, items: { type: Type.NUMBER } },
          sign: { type: Type.STRING, enum: ["<=", ">=", "="] },
          rhs: { type: Type.NUMBER }
        }
      }
    }
  },
  required: ["type", "variables", "objectiveCoefficients", "constraints"]
};

const parseResponse = (text: string | undefined): LPProblem => {
    if (!text) throw new Error("No response text from Gemini");
    
    try {
        const rawData = JSON.parse(text);
        return {
            type: rawData.type === "MAXIMIZE" ? OptimizationType.MAXIMIZE : OptimizationType.MINIMIZE,
            variables: rawData.variables,
            objectiveCoefficients: rawData.objectiveCoefficients,
            constraints: rawData.constraints.map((c: any, idx: number) => ({
                id: `c-${idx}`,
                coefficients: c.coefficients,
                sign: c.sign as ConstraintSign,
                rhs: c.rhs
            }))
        };
    } catch (e) {
        console.error("JSON Parse Error", e);
        throw new Error("Failed to parse AI response.");
    }
};

export const extractLPFromImage = async (base64Image: string, mimeType: string): Promise<LPProblem> => {
  const modelId = "gemini-2.5-flash"; 

  const prompt = `
    Analyze the image and extract the Linear Programming problem.
    Identify the objective function (maximize or minimize), the variables, and the constraints.
    Standardize variable names to x1, x2, x3... if they are named x, y, z.
    Return the result in a structured JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA
      },
    });

    return parseResponse(response.text);

  } catch (error) {
    console.error("Gemini Image Extraction Error:", error);
    throw new Error("Failed to extract LP problem from image.");
  }
};

export const extractLPFromText = async (textInput: string): Promise<LPProblem> => {
    const modelId = "gemini-2.5-flash";
    const prompt = `
      Analyze the following text and extract the Linear Programming problem.
      The text might be a word problem or a mathematical formulation.
      Identify the objective function (maximize or minimize), the variables, and the constraints.
      Standardize variable names to x1, x2, x3... unless specific names are critical.
      
      Text Input:
      "${textInput}"
      
      Return the result in a structured JSON format.
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: modelId,
        contents: { parts: [{ text: prompt }] },
        config: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA
        },
      });
  
      return parseResponse(response.text);
  
    } catch (error) {
      console.error("Gemini Text Extraction Error:", error);
      throw new Error("Failed to extract LP problem from text.");
    }
  };
