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

export const ai = genkit({
  plugins: [googleAI({apiKey})],
});

//
// Ordered by speed and free quota generosity
//
const MODELS = [
  'googleai/gemini-1.5-flash-latest',
  'googleai/gemini-1.5-pro-latest',
  'googleai/gemini-1.0-pro',
  'googleai/gemini-pro',
  'googleai/gemini-flash',
];

let currentModelIndex = 0;


//
// Round-robin model selector
//
function getNextModel() {
  const model = MODELS[currentModelIndex % MODELS.length];
  currentModelIndex++;
  return model;
}

//
// Custom prompt wrapper with:
//  - Round-robin load balancing
//  - Automatic fallback on quota/500 errors
//
export async function definePromptWithFallback<
  I extends z.ZodTypeAny,
  O extends z.ZodTypeAny,
>(options: Omit<PromptOptions<I, O>, 'model'>, input: z.infer<I>) {
  let attempts = 0;

  while (attempts < MODELS.length) {
    const model = getNextModel();
    const prompt = ai.definePrompt({...options, model: model as any});
    attempts++;

    try {
      console.log(`- Attempt ${attempts}/${MODELS.length}: Using model ${model}`);
      const {output} = await prompt(input);
      return {output};
    } catch (err: any) {
      const isRetryableError =
        (err.status && (err.status === 429 || err.status >= 500)) ||
        (err.message && (err.message.includes('429') || err.message.includes('quota')));

      if (isRetryableError) {
        console.warn(`  - Model ${model} failed (Retryable Error). Trying next...`);
      } else {
        console.error(`- Model ${model} failed (Non-Retryable Error).`, err);
        throw err;
      }
    }
  }

  throw new Error(
    'All available AI models failed or exceeded their quotas. Please try again later.'
  );
}
