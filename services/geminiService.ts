
import { GoogleGenAI, Type } from "@google/genai";
import { LPProblem, OptimizationType, ConstraintSign, NetworkTask, UniversalProblemResult, ProblemCategory, TransportationInput, AssignmentInput, QueuingInput, GameTheoryInput } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- UNIVERSAL SCHEMA DEFINITION ---
const UNIVERSAL_SCHEMA = {
  type: Type.OBJECT,
  description: "A structured representation of an Operations Research problem.",
  properties: {
    category: { 
      type: Type.STRING, 
      enum: ["LINEAR_PROGRAMMING", "NETWORK", "TRANSPORTATION", "ASSIGNMENT", "QUEUING", "GAME_THEORY"],
      description: "The identified category of the problem."
    },
    // Linear Programming Schema
    lp: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        type: { type: Type.STRING, enum: ["MAXIMIZE", "MINIMIZE"] },
        variables: { type: Type.ARRAY, items: { type: Type.STRING } },
        objectiveCoefficients: { type: Type.ARRAY, items: { type: Type.NUMBER } },
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
      }
    },
    // Network (CPM/PERT) Schema
    network: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        tasks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              predecessors: { type: Type.ARRAY, items: { type: Type.STRING } },
              duration: { type: Type.NUMBER },
              optimistic: { type: Type.NUMBER },
              mostLikely: { type: Type.NUMBER },
              pessimistic: { type: Type.NUMBER }
            },
            required: ["id", "name", "predecessors"]
          }
        }
      }
    },
    // Transportation Schema
    transportation: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        sources: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              supply: { type: Type.NUMBER }
            }
          }
        },
        destinations: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              demand: { type: Type.NUMBER }
            }
          }
        },
        costs: {
          type: Type.ARRAY,
          description: "2D array where costs[sourceIndex][destIndex] is the cost.",
          items: {
            type: Type.ARRAY,
            items: { type: Type.NUMBER }
          }
        }
      }
    },
    // Assignment Schema
    assignment: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        type: { type: Type.STRING, enum: ["MAXIMIZE", "MINIMIZE"] },
        rows: {
          type: Type.ARRAY,
          items: { type: Type.OBJECT, properties: { name: { type: Type.STRING } } }
        },
        cols: {
          type: Type.ARRAY,
          items: { type: Type.OBJECT, properties: { name: { type: Type.STRING } } }
        },
        matrix: {
          type: Type.ARRAY,
          description: "2D array of values",
          items: {
            type: Type.ARRAY,
            items: { type: Type.NUMBER }
          }
        }
      }
    },
    // Queuing Schema
    queuing: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        arrivalRate: { type: Type.NUMBER, description: "Lambda" },
        serviceRate: { type: Type.NUMBER, description: "Mu" },
        timeUnit: { type: Type.STRING, description: "e.g. Hour, Minute" }
      }
    },
    // Game Theory Schema
    gameTheory: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        playerAStrategies: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Strategy names for Row Player (A)"
        },
        playerBStrategies: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Strategy names for Col Player (B)"
        },
        matrix: {
          type: Type.ARRAY,
          description: "Payoff matrix",
          items: {
            type: Type.ARRAY,
            items: { type: Type.NUMBER }
          }
        }
      }
    }
  },
  required: ["category"]
};

// Helper to convert raw JSON to internal types
const mapResponseToResult = (data: any): UniversalProblemResult => {
    const result: UniversalProblemResult = { category: data.category };

    if (data.category === "LINEAR_PROGRAMMING" && data.lp) {
        result.lp = {
            type: data.lp.type === "MAXIMIZE" ? OptimizationType.MAXIMIZE : OptimizationType.MINIMIZE,
            variables: data.lp.variables || [],
            objectiveCoefficients: data.lp.objectiveCoefficients || [],
            constraints: (data.lp.constraints || []).map((c: any, idx: number) => ({
                id: `c-${idx}`,
                coefficients: c.coefficients || [],
                sign: c.sign as ConstraintSign,
                rhs: c.rhs || 0
            }))
        };
    } else if (data.category === "NETWORK" && data.network) {
        result.network = (data.network.tasks || []).map((t: any) => ({
            id: t.id,
            name: t.name,
            predecessors: t.predecessors || [],
            duration: t.duration || 0,
            optimistic: t.optimistic,
            mostLikely: t.mostLikely,
            pessimistic: t.pessimistic
        }));
    } else if (data.category === "TRANSPORTATION" && data.transportation) {
        result.transportation = {
            sources: (data.transportation.sources || []).map((s: any, i: number) => ({ id: `s${i}`, name: s.name, supply: s.supply })),
            destinations: (data.transportation.destinations || []).map((d: any, i: number) => ({ id: `d${i}`, name: d.name, demand: d.demand })),
            costs: data.transportation.costs || []
        };
    } else if (data.category === "ASSIGNMENT" && data.assignment) {
        result.assignment = {
            type: data.assignment.type === "MAXIMIZE" ? OptimizationType.MAXIMIZE : OptimizationType.MINIMIZE,
            rows: (data.assignment.rows || []).map((r: any, i: number) => ({ id: `r${i}`, name: r.name })),
            cols: (data.assignment.cols || []).map((c: any, i: number) => ({ id: `c${i}`, name: c.name })),
            matrix: data.assignment.matrix || []
        };
    } else if (data.category === "QUEUING" && data.queuing) {
        result.queuing = {
            arrivalRate: data.queuing.arrivalRate || 0,
            serviceRate: data.queuing.serviceRate || 0,
            timeUnit: data.queuing.timeUnit || 'Hour'
        };
    } else if (data.category === "GAME_THEORY" && data.gameTheory) {
        result.gameTheory = {
            playerAStrategies: data.gameTheory.playerAStrategies || [],
            playerBStrategies: data.gameTheory.playerBStrategies || [],
            matrix: data.gameTheory.matrix || []
        };
    }

    return result;
};

// Universal Prompt Generator
const getPrompt = () => `
  You are an Operations Research Expert. Analyze the user's input (Text or Image) and classify it into one of these categories:
  1. LINEAR_PROGRAMMING (Simplex, Max/Min Z)
  2. NETWORK (PERT/CPM, Critical Path, activities, predecessors, durations)
  3. TRANSPORTATION (Sources/Supply, Destinations/Demand, Cost Matrix)
  4. ASSIGNMENT (Workers/Jobs, Cost/Profit Matrix, Hungarian Method)
  5. QUEUING (M/M/1, Arrival Rate/Lambda, Service Rate/Mu)
  6. GAME_THEORY (Payoff Matrix, Player A/B Strategies, Saddle Point, Pure/Mixed Strategy)

  Identify the category and then extract the data into the specific JSON object for that category.
  
  Rules:
  - If LP: Identify variables (x1, x2..), objective, and constraints.
  - If Network: Identify tasks, predecessors, and duration(s). If 3 durations provided (a, m, b), fill PERT fields.
  - If Transportation: Identify sources (supply), destinations (demand), and unit costs.
  - If Assignment: Identify rows (workers), cols (tasks), and the matrix values. Check if it's Minimization (cost/time) or Maximization (profit).
  - If Queuing: Extract Arrival Rate (lambda) and Service Rate (mu). Ensure units match (convert if needed so they are 'per same unit').
  - If Game Theory: Extract the payoff matrix. Identify strategies for Player A (Rows) and Player B (Columns).
  
  Return ONLY the JSON structure.
`;

export const extractProblemUniversal = async (input: string | { image: string, mime: string }): Promise<UniversalProblemResult> => {
    const modelId = "gemini-2.5-flash"; 
    const contents: any[] = [{ text: getPrompt() }];

    if (typeof input === 'string') {
        contents.push({ text: `Analyze this text: "${input}"` });
    } else {
        contents.unshift({
            inlineData: {
                data: input.image,
                mimeType: input.mime
            }
        });
    }

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: { parts: contents },
            config: {
                responseMimeType: "application/json",
                responseSchema: UNIVERSAL_SCHEMA
            },
        });

        if (!response.text) throw new Error("No response from AI");
        const rawData = JSON.parse(response.text);
        return mapResponseToResult(rawData);

    } catch (error) {
        console.error("AI Extraction Error:", error);
        throw new Error("Failed to interpret problem. Please try a clearer image or text.");
    }
};

// Keep deprecated methods for backward compat if needed, or redirect them
export const extractLPFromImage = async (img: string, mime: string) => {
    const res = await extractProblemUniversal({image: img, mime});
    if (res.category === 'LINEAR_PROGRAMMING' && res.lp) return res.lp;
    throw new Error("Input was not recognized as a Linear Programming problem.");
};

export const extractLPFromText = async (text: string) => {
    const res = await extractProblemUniversal(text);
    if (res.category === 'LINEAR_PROGRAMMING' && res.lp) return res.lp;
    throw new Error("Input was not recognized as a Linear Programming problem.");
};

export const extractNetworkFromText = async (text: string): Promise<NetworkTask[]> => {
    const res = await extractProblemUniversal(text);
    if (res.category === 'NETWORK' && res.network) return res.network;
    throw new Error("Input was not recognized as a Network/PERT problem.");
};
