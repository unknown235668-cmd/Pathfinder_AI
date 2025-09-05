
'use server';

/**
 * @fileOverview Finds nearby government colleges using AI, with category filtering.
 *
 * - findNearbyColleges - A function that returns a list of colleges.
 * - FindNearbyCollegesInput - The input type for the findNearbyColleges function.
 * - FindNearbyCollegesOutput - The return type for the findNearbyColleges function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// 1. Backend: Input and Output Schemas
// The input now includes an optional 'category' field.
const FindNearbyCollegesInputSchema = z.object({
  location: z.string().describe('A city, state, alias, or abbreviation in India.'),
  category: z.string().optional().describe('An optional category to filter colleges (e.g., engineering, medical).')
});
export type FindNearbyCollegesInput = z.infer<typeof FindNearbyCollegesInputSchema>;

// The output schema for each college now includes a 'category' field.
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
  })).describe("An array of government-run institutions in the specified location. Exclude all private, deemed, or international institutions.")
});
export type FindNearbyCollegesOutput = z.infer<typeof FindNearbyCollegesOutputSchema>;

// Export the function that the frontend will call.
export async function findNearbyColleges(
  input: FindNearbyCollegesInput
): Promise<FindNearbyCollegesOutput> {
  return findNearbyCollegesFlow(input);
}

// 2. Backend: AI Prompt
// The prompt is updated to conditionally use the category if provided.
const prompt = ai.definePrompt({
  name: 'findNearbyCollegesPrompt',
  input: { schema: FindNearbyCollegesInputSchema },
  output: { schema: FindNearbyCollegesOutputSchema },
  prompt: `
You are an expert Indian education data assistant.

User Input:
- Location: {{{location}}} (city, district, state, or nickname).
{{#if category}}- Category: {{{category}}}{{/if}}

Instructions:

1. Normalize the input location to its official name(s).
   - Example: "Trichy" -> "Tiruchirappalli"
   - Example: "Bangalore" -> "Bengaluru"

2. Generate a complete list of ALL government-run institutions (colleges, universities, institutes) in that location.
   - Include: Central/State Universities, IITs, NITs, IIITs, AIIMS, government medical colleges, government polytechnics, vocational institutes.
   - Exclude: Private, deemed, autonomous, and international institutions.
   {{#if category}}
   - IMPORTANT: The user has specified a category. Return ONLY institutions that match the "{{{category}}}" category.
   {{/if}}

3. Format each record as JSON with these fields:
   - id -> unique number
   - name -> official name
   - type -> "college", "university", or "institute"
   - category -> Primary category of the college (e.g. Engineering, Medical, Arts)
   - state -> state name
   - city -> city/district
   - address -> postal address
   - website -> official website (optional)
   - approval_body -> UGC, AICTE, NMC, etc.

4. Return JSON array under the 'colleges' key. If no colleges are found, return an empty array.
`,
});

// 3. Backend: AI Flow without caching
const findNearbyCollegesFlow = ai.defineFlow(
  {
    name: 'findNearbyCollegesFlow',
    inputSchema: FindNearbyCollegesInputSchema,
    outputSchema: FindNearbyCollegesOutputSchema,
  },
  async (input) => {
    // Call the AI directly without checking cache.
    const { output } = await prompt(input);
    return output!;
  }
);
