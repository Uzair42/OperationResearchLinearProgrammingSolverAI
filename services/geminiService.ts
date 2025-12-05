import { GoogleGenAI, Type } from "@google/genai";
import { LPProblem, OptimizationType, ConstraintSign } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractLPFromImage = async (base64Image: string, mimeType: string): Promise<LPProblem> => {
  const modelId = "gemini-2.5-flash"; // Good balance of speed and reasoning for extraction

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
        responseSchema: {
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
        }
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini");

    const rawData = JSON.parse(text);

    // Map the raw JSON to our strictly typed LPProblem interface
    const problem: LPProblem = {
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

    return problem;

  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw new Error("Failed to extract LP problem from image.");
  }
};
