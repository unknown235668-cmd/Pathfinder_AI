
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'zod';
import type {PromptOptions} from 'genkit';

//
// API Key Setup
//
const apiKey = process.env.GEMINI_API_KEY_FALLBACK || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn(
    'GEMINI_API_KEY or GEMINI_API_KEY_FALLBACK environment variable not set. AI features may not work.'
  );
}

//
// Ordered by speed and free quota generosity
//
export const MODELS = [
  'googleai/gemini-1.5-flash-latest',
  'googleai/gemini-1.5-pro-latest',
  'googleai/gemini-1.0-pro',
  'googleai/gemini-pro',
  'googleai/gemini-flash',
];

//
// Base AI client
//
export const ai = genkit({
  plugins: [googleAI({apiKey})],
});
