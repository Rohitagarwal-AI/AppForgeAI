import { GoogleGenAI } from '@google/genai';

export function hasGeminiKey() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function generateGeminiJson(system: string, prompt: string) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await client.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    contents: `${system}\n\nReturn valid JSON only.\n\n${prompt}`,
    config: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  });

  if (!response.text) {
    throw new Error('Gemini returned an empty response');
  }
  return JSON.parse(response.text);
}
