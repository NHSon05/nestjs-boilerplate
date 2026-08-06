import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('GEMINI_API_KEY is missing');
}

const ai = new GoogleGenAI({ apiKey });

const response = await ai.models.generateContent({
  model: process.env.GEMINI_MODEL,
  contents: 'Hello',
});

console.log(response.text);
