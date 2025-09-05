
'use server';

/**
 * @fileOverview Finds nearby colleges using AI based on a location string.
 *
 * - findNearbyColleges - A function that returns a list of colleges.
 * - FindNearbyCollegesInput - The input type for the findNearbyColleges function.
 * - FindNearbyCollegesOutput - The return type for the findNearbyColleges function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FindNearbyCollegesInputSchema = z.object({
  location: z.string().describe('A city, state, alias, or abbreviation in India.')
});
export type FindNearbyCollegesInput = z.infer<typeof FindNearbyCollegesInputSchema>;

const FindNearbyCollegesOutputSchema = z.object({
  colleges: z.array(z.object({
    id: z.number().describe("A unique number for the institution."),
    name: z.string().describe("The official name of the institution."),
    type: z.enum(["college", "university", "institute"]).describe("The type of institution."),
    state: z.string().describe("The state where the institution is located."),
    city: z.string().describe("The city or district where the institution is located."),
    address: z.string().describe("The full postal address."),
    website: z.string().describe("The official website (if available)."),
    approval_body: z.string().describe("e.g., UGC, AICTE, NMC"),
  })).describe("An array of government-run institutions in the specified location. Exclude all private, deemed, or international institutions.")
});
export type FindNearbyCollegesOutput = z.infer<typeof FindNearbyCollegesOutputSchema>;

export async function findNearbyColleges(
  input: FindNearbyCollegesInput
): Promise<FindNearbyCollegesOutput> {
  return findNearbyCollegesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findNearbyCollegesPrompt',
  input: {schema: FindNearbyCollegesInputSchema},
  output: {schema: FindNearbyCollegesOutputSchema},
  prompt: `You are an expert Indian education data assistant.

User Input: {{{location}}} (city, district, state, or nickname).

Instructions:

1. Normalize the input location to its official name(s). 
   - Example: "Trichy" → "Tiruchirappalli"
   - Example: "Bangalore" → "Bengaluru"

2. Generate a complete list of ALL government-run institutions (colleges, universities, institutes) in that location. 
   - Include: Central/State Universities, IITs, NITs, IIITs, AIIMS, government medical colleges, government polytechnics, vocational institutes.
   - Exclude: Private, deemed, autonomous, and international institutions.

3. Format each record as JSON with these fields:
   - id → unique number
   - name → official name
   - type → "college", "university", or "institute"
   - state → state name
   - city → city/district
   - address → postal address
   - website → official website (optional)
   - approval_body → UGC, AICTE, NMC, etc.

4. Return JSON array under the 'colleges' key.
`,
});

const findNearbyCollegesFlow = ai.defineFlow(
  {
    name: 'findNearbyCollegesFlow',
    inputSchema: FindNearbyCollegesInputSchema,
    outputSchema: FindNearbyCollegesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
