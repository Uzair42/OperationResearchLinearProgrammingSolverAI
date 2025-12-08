import { LPProblem } from "../types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE || "http://localhost:3001";

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Server error: ${res.status} ${text}`);
  }
  return res.json();
};

export const extractLPFromImage = async (base64Image: string, mimeType: string): Promise<LPProblem> => {
  const res = await fetch(`${API_BASE}/api/extract-from-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64Image, mimeType })
  });
  return handleResponse(res);
};

export const extractLPFromText = async (textInput: string): Promise<LPProblem> => {
  const res = await fetch(`${API_BASE}/api/extract-from-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: textInput })
  });
  return handleResponse(res);
};