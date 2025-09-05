
'use server';

/**
 * @fileOverview Finds nearby government colleges using AI, with optional location and category filtering, and Firestore caching.
 *
 * - findNearbyColleges - A function that returns a list of colleges.
 * - FindNearbyCollegesInput - The input type for the findNearbyColleges function.
 * - FindNearbyCollegesOutput - The return type for the findNearbyColleges function.
 */

import { ai } from '@/ai/genkit';
import { firestore } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { z } from 'genkit';

// 1. Backend: Input and Output Schemas
// Both location and category are optional to allow for nationwide or category-wide searches.
const FindNearbyCollegesInputSchema = z.object({
  location: z.string().optional().describe('A city, state, alias, or abbreviation in India. If empty, searches all of India.'),
  category: z.string().optional().describe('An optional category to filter colleges (e.g., engineering, medical).')
});
export type FindNearbyCollegesInput = z.infer<typeof FindNearbyCollegesInputSchema>;

// The output schema for each college.
const FindNearbyCollegesOutputSchema = z.object({
  colleges: z.array(z.object({
    id: z.number().describe("A unique number for the institution."),
    name: z.string().describe("The official name of the institution."),
    type: z.enum(["college", "university", "institute"]).describe("The type of institution."),
    category: z.string().describe("The primary category of the institution (e.g., Engineering, Medical, Arts)."),
    state: z.string().describe("The state where the institution is located."),
    city: z.string().describe("The city or district where the institution is located."),
    address: z.string().describe("The full postal address."),
    website: z.string().optional().describe("The official website (if available)."),
    approval_body: z.string().describe("e.g., UGC, AICTE, NMC"),
  })).describe("An array of government-run institutions. Exclude all private, deemed, or international institutions.")
});
export type FindNearbyCollegesOutput = z.infer<typeof FindNearbyCollegesOutputSchema>;

// Export the function that the frontend will call.
export async function findNearbyColleges(
  input: FindNearbyCollegesInput
): Promise<FindNearbyCollegesOutput> {
  return findNearbyCollegesFlow(input);
}

// 2. Backend: AI Prompt
// The prompt is updated to handle optional location and category.
const prompt = ai.definePrompt({
  name: 'findNearbyCollegesPrompt',
  input: { schema: FindNearbyCollegesInputSchema },
  output: { schema: FindNearbyCollegesOutputSchema },
  prompt: `
You are an expert Indian education data assistant.

User Input:
{{#if location}}- Location: {{{location}}}{{else}}- Location: All of India{{/if}}
{{#if category}}- Category: {{{category}}}{{/if}}

Instructions:

1. Normalize the input location to its official name(s) if provided.

2. Generate a complete list of ALL government-run institutions (colleges, universities, institutes) that match the criteria.
   - If location is provided, scope the search to that location.
   - If location is NOT provided, search all of India.
   - If category is provided, filter the results to ONLY institutions matching that category.
   - Include: Central/State Universities, IITs, NITs, IIITs, AIIMS, government medical colleges, government polytechnics, vocational institutes.
   - Exclude: Private, deemed, autonomous, and international institutions.

3. Format each record as JSON with these fields:
   - id -> unique number
   - name -> official name
   - type -> "college", "university", or "institute"
   - category -> Primary category of the college
   - state -> state name
   - city -> city/district
   - address -> postal address
   - website -> official website (optional)
   - approval_body -> UGC, AICTE, NMC, etc.

4. Return a JSON array under the 'colleges' key. If no institutions are found, return an empty array.
`,
});

// 3. Backend: AI Flow with Firestore Caching
const findNearbyCollegesFlow = ai.defineFlow(
  {
    name: 'findNearbyCollegesFlow',
    inputSchema: FindNearbyCollegesInputSchema,
    outputSchema: FindNearbyCollegesOutputSchema,
  },
  async (input) => {
    // Create a dynamic cache key based on both location and category.
    const cacheKey = `${input.location?.toLowerCase() || 'all'}_${input.category || 'all'}`;
    const cacheRef = doc(firestore, 'collegesCache', cacheKey);
    
    // Check the cache first.
    try {
      const cached = await getDoc(cacheRef);
      if (cached.exists()) {
        console.log(`[Cache] HIT for key: ${cacheKey}`);
        return cached.data() as FindNearbyCollegesOutput;
      }
      console.log(`[Cache] MISS for key: ${cacheKey}`);
    } catch (e) {
      console.error("Failed to read from Firestore cache. Proceeding with AI call.", e);
    }
    
    // If not in cache, call the AI.
    const { output } = await prompt(input);
    
    // If there is an output, save it to the cache for future requests.
    if (output) {
      try {
        await setDoc(cacheRef, output);
        console.log(`[Cache] Wrote to key: ${cacheKey}`);
      } catch (e) {
        console.error("Failed to write to Firestore cache.", e);
      }
    }

    return output!;
  }
);
