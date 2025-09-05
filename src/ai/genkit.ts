
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
  'googleai/gemini-2.5-flash-lite', // 1,000/day
  'googleai/gemini-2.0-flash-lite', // 200/day
  'googleai/gemini-1.5-flash', // Good balance
  'googleai/gemini-2.5-flash', // 250/day
  'googleai/gemini-2.0-flash', // 200/day
  'googleai/gemini-1.5-pro', // Powerful, sometimes free tier
  'googleai/gemini-2.5-pro', // 100/day
];

//
// Base AI client
//
export const ai = genkit({
  plugins: [googleAI({apiKey})],
});
