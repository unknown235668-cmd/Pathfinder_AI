/**
 * src/ai/genkit.ts
 *
 * Robust GenKit wrapper with:
 *  - model name normalization (no 'googleai/' prefix)
 *  - round-robin model selection
 *  - API key rotation (re-init genkit plugin when key changes)
 *  - retry logic for 404/429/5xx/quota errors
 *  - abort on auth/permission errors (401/403/permission)
 *
 * NOTE: Replace placeholder API keys or set GEMINI_API_KEY in your environment.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';
import type { PromptAction, PromptOptions } from 'genkit';

/* ---------------------------
   API KEY CONFIGURATION
   ---------------------------
   Prefer setting GEMINI_API_KEY in environment:
     export GEMINI_API_KEY="AIzaSy...."
   The array below contains optional fallback keys (redacted placeholders).
*/
const API_KEYS = [
  process.env.GEMINI_API_KEY,
  // Add fallback keys here if you want (placeholders shown). DON'T commit real keys.
  process.env.GEMKIT_FALLBACK_KEY_1 || 'AIzaSyREDACTED_1',
  process.env.GEMKIT_FALLBACK_KEY_2 || 'AIzaSyREDACTED_2',
].filter(Boolean) as string[];

if (API_KEYS.length === 0) {
  console.warn(
    'No API keys configured: set GEMINI_API_KEY or add fallback keys. AI features may not work.'
  );
}

/* ---------------------------
   MODELS (candidate list)
   - Use provider-agnostic model names (no "googleai/" prefix)
   - Order matters: try fastest/cheapest first, then fallbacks
*/
const MODELS = [
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
  'gemini-1.5-flash-002', // try concrete versions if -latest fails
  'gemini-1.5-pro-002',
];

/* ---------------------------
   Global mutable state
*/
let currentApiKeyIndex = 0;
let currentModelIndex = 0;

/* Initialize genkit AI client with the first key */
let ai = createAiForKey(API_KEYS[currentApiKeyIndex]);

/* Helper: create genkit instance for a given API key */
function createAiForKey(key: string) {
  // Re-init genkit + googleAI plugin with the provided key
  // Note: constructing a new genkit instance is cheap here for simplicity.
  return genkit({
    plugins: [googleAI({ apiKey: key })],
  });
}

/* Rotate to the next API key and re-init the ai client.
   Returns the newly selected key (string).
*/
function switchToNextApiKey(): string {
  if (API_KEYS.length <= 1) {
    // nothing to rotate to
    console.warn('- No fallback API keys available to rotate to.');
    return API_KEYS[currentApiKeyIndex];
  }
  currentApiKeyIndex = (currentApiKeyIndex + 1) % API_KEYS.length;
  const nextKey = API_KEYS[currentApiKeyIndex];
  console.log(`- Rotating to API key index=${currentApiKeyIndex}`);
  ai = createAiForKey(nextKey);
  return nextKey;
}

/* Round-robin model getter */
function getNextModel(): string {
  const model = MODELS[currentModelIndex % MODELS.length];
  currentModelIndex++;
  return model;
}

/* Utility: detect if an error message or status is retryable */
function isRetryableError(err: any): boolean {
  const status = err?.status || err?.code;
  const msg = String(err?.message || '').toLowerCase();

  // Retry on rate limits, quota, server errors, and not-found (to try other model names)
  if (status === 429 || (typeof status === 'number' && status >= 500) || status === 404) {
    return true;
  }
  if (msg.includes('429') || msg.includes('quota') || msg.includes('rate limit') || msg.includes('not_found') || msg.includes('not found')) {
    return true;
  }
  return false;
}

/* Utility: detect if error is auth/permission — stop retries and bubble up */
function isAuthOrPermissionError(err: any): boolean {
  const status = err?.status || err?.code;
  const msg = String(err?.message || '').toLowerCase();

  if (status === 401 || status === 403) return true;
  if (msg.includes('permission') || msg.includes('unauthorized') || msg.includes('forbidden') || msg.includes('invalid api key')) {
    return true;
  }
  return false;
}

/* ---------------------------
   definePromptWithFallback
   - options: PromptOptions (except model)
   - input: user input for the prompt (z.infer<I>)
   - Behavior: try model+key combos until success or fatal error
*/
export async function definePromptWithFallback<
  I extends z.ZodTypeAny,
  O extends z.ZodTypeAny,
>(
  options: Omit<PromptOptions<I, O>, 'model'>,
  input: z.infer<I>
): Promise<{ output: z.infer<O> }> {
  // Track attempts to avoid infinite loops: max attempts = models * keys
  const maxAttempts = Math.max(1, MODELS.length * API_KEYS.length);
  let attempts = 0;
  const initialApiKeyIndex = currentApiKeyIndex;

  while (attempts < maxAttempts) {
    attempts++;

    // Choose model and key for this attempt
    const model = getNextModel();
    const apiKey = API_KEYS[currentApiKeyIndex];

    // Ensure ai client matches current api key (it should, but re-init if not)
    // (createAiForKey already called in switchToNextApiKey)
    if (!ai) {
      ai = createAiForKey(apiKey);
    }

    // Build prompt for the chosen model
    const prompt = ai.definePrompt({ ...options, model: googleModelName(model) as any });

    console.log(`- Attempt #${attempts}: model="${model}" apiKeyIndex=${currentApiKeyIndex}`);

    try {
      const res = await prompt(input);
      console.log(`- Success with model="${model}" apiKeyIndex=${currentApiKeyIndex}`);
      return res as { output: z.infer<O> };
    } catch (err: any) {
      console.warn(`- Attempt failed: model="${model}" apiKeyIndex=${currentApiKeyIndex} -> ${err?.message || err}`);

      // If it's an auth/permission error, abort and rethrow — user must fix credentials/permissions
      if (isAuthOrPermissionError(err)) {
        console.error('- Detected authentication/permission error. Aborting retries.');
        throw err;
      }

      // If it's retryable (404 / 429 / server errors / quota), rotate to next model/key
      if (isRetryableError(err)) {
        // rotate API key after cycling all models once, so we try different key/model combos
        if (attempts % MODELS.length === 0) {
          // switch to next API key (re-inits ai)
          const prevKeyIndex = currentApiKeyIndex;
          const nextKey = switchToNextApiKey();
          console.log(`- Switched API key from index ${prevKeyIndex} -> ${currentApiKeyIndex}`);
          // If we came full circle to the initial key, and everything still fails, we'll eventually exit by maxAttempts
          if (currentApiKeyIndex === initialApiKeyIndex && attempts >= maxAttempts) {
            console.error('- Completed full rotation of API keys and models with no success.');
          }
        }
        // continue to next attempt
        continue;
      }

      // Non-retryable & non-auth error -> rethrow
      console.error('- Non-retryable error encountered. Throwing.');
      throw err;
    }
  }

  // Exhausted all attempts
  throw new Error('All models and API keys exhausted. Please check keys, project permissions, and model availability.');
}

/* Helpers */

/** Normalize / validate model name for googleAI.model(...) if needed.
 * genkit/googleAI plugin expects the model identifier (e.g. 'gemini-1.5-flash-002').
 * This function is a light wrapper in case you want to add transformations later.
 */
function googleModelName(name: string) {
  // If user accidentally passes 'googleai/xxx', strip it.
  return name.replace(/^googleai\//, '');
}

/* ---------------------------
   Example usage (commented)
   ---------------------------
   Example minimal prompt usage:

   import { z } from 'zod';
   const inputSchema = z.string();
   const outputSchema = z.object({ text: z.string() });

   (async () => {
     try {
       const res = await definePromptWithFallback(
         {
           name: 'testPrompt',
           input: inputSchema,
           output: outputSchema,
           // prompt may be a string template or a function depending on genkit usage
           prompt: `Say hello to {{{ input }}}`,
         },
         "World" // input that matches inputSchema
       );
       console.log('Result:', res.output);
     } catch (e) {
       console.error('Final failure:', e);
     }
   })();

*/

export default {
  definePromptWithFallback,
};
