'use server';
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

//
// Custom prompt wrapper with:
//  - Automatic fallback on quota/500 errors
//  - Null-safety for inputs
//
export function definePromptWithFallback<
  I extends z.ZodTypeAny,
  O extends z.ZodTypeAny,
>(options: PromptOptions<I, O>) {
  return async (input: z.infer<I>, promptOptions?: any) => {
    if (input == null) {
      throw new Error(
        `❌ Prompt input cannot be null. Expected: ${options.input}`
      );
    }

    let attempts = 0;
    let currentModelIndex = 0;

    while (attempts < MODELS.length) {
      const model = MODELS[currentModelIndex % MODELS.length];
      currentModelIndex++;
      const dynamicPrompt = ai.definePrompt({...options, model});

      try {
        console.log(`🟢 Using model: ${model}`);
        const output = await dynamicPrompt(input, promptOptions);
        return output;
      } catch (err: any) {
        const isRetryableError =
          (err.status && (err.status === 429 || err.status >= 500)) ||
          (err.code && err.code === 'quota_exceeded') ||
          (err.message &&
            (err.message.includes('429') ||
              err.message.includes('quota') ||
              err.message.includes('500')));

        if (isRetryableError) {
          console.warn(
            `⚠️ Retryable error for ${model} (Status: ${
              err.status || 'N/A'
            }). Trying next model...`
          );
          attempts++;
        } else {
          console.error('❌ Non-retryable error:', err);
          throw err;
        }
      }
    }

    throw new Error(
      '🚨 All Gemini models failed or exceeded free tier quota for today.'
    );
  };
}
