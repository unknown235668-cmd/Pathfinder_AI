'use server';

/**
 * @fileOverview Finds nearby government or private colleges using AI, with optional location and category filtering.
 *
 * - findNearbyColleges - A function that returns a list of colleges.
 * - FindNearbyCollegesInput - The input type for the findNearbyColleges function.
 * - FindNearbyCollegesOutput - The return type for the findNearbyColleges function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema: Defines the expected inputs for the AI flow.
const FindNearbyCollegesInputSchema = z.object({
  location: z.string().optional().describe('A city, state, alias, or abbreviation in India. If empty, searches all of India.'),
  category: z.string().optional().describe('An optional category to filter colleges (e.g., engineering, medical).'),
  typeFilter: z.string().optional().describe('The type of institution to filter by: "government" or "private". Defaults to "government".')
});
export type FindNearbyCollegesInput = z.infer<typeof FindNearbyCollegesInputSchema>;

// Output Schema: Defines the expected structure of the AI's response.
const FindNearbyCollegesOutputSchema = z.object({
  colleges: z.array(z.object({
    id: z.number().describe("A unique number for the institution."),
    name: z.string().describe("The official name of the institution."),
    type: z.enum(["college", "university", "institute"]).describe("The type of institution."),
    ownership: z.enum(["government", "private"]).describe("The ownership type of the institution."),
    category: z.string().describe("The primary category of the institution (e.g., Engineering, Medical, Arts)."),
    state: z.string().describe("The state where the institution is located."),
    city: z.string().describe("The city or district where the institution is located."),
    address: z.string().describe("The full postal address."),
    website: z.string().optional().describe("The official website (if available)."),
    approval_body: z.string().describe("e.g., UGC, AICTE, NMC"),
  })).describe("An array of institutions matching the filter criteria.")
});
export type FindNearbyCollegesOutput = z.infer<typeof FindNearbyCollegesOutputSchema>;

// Export the function that the frontend will call.
export async function findNearbyColleges(
  input: FindNearbyCollegesInput
): Promise<FindNearbyCollegesOutput> {
  // Directly calling the flow without caching to ensure stability.
  return findNearbyCollegesFlow(input);
}

// AI Prompt: The core instruction set for the language model.
const prompt = ai.definePrompt({
  name: 'findNearbyCollegesPrompt',
  input: { schema: FindNearbyCollegesInputSchema },
  output: { schema: FindNearbyCollegesOutputSchema },
  prompt: `
You are an expert Indian education data assistant. Your task is to generate a list of educational institutions based on user-provided filters.

User Input:
- Location: {{#if location}}{{{location}}}{{else}}All of India{{/if}}
- Category: {{#if category}}{{{category}}}{{else}}All categories{{/if}}
- Institution Type: {{#if typeFilter}}{{{typeFilter}}}{{else}}government{{/if}}

Instructions:

1.  **Analyze Filters**:
    -   If a \`location\` is provided, normalize it to its official name(s) (e.g., "Mumbai" for "Bombay").
    -   The primary filter is \`typeFilter\`. You must only return institutions that match this type ('government' or 'private').
    -   If a \`category\` is provided, further filter the results to ONLY institutions matching that category.

2.  **Generate List**:
    -   Based on the \`typeFilter\`, generate a complete list of all matching institutions (colleges, universities, institutes).
    -   For 'government', include: Central/State Universities, IITs, NITs, IIITs, AIIMS, government medical colleges, government polytechnics, vocational institutes.
    -   For 'private', include: Private universities, private colleges, and other non-governmental educational bodies.
    -   **Crucially, you must exclude any institution that does not match the \`typeFilter\`**

3.  **Format Output**:
    -   Format each record as a JSON object with the following fields:
        -   \`id\`: A unique number for the institution.
        -   \`name\`: The official name of the institution.
        -   \`type\`: "college", "university", or "institute".
        -   \`ownership\`: The type of institution, must be the same as 'typeFilter' ('government' or 'private').
        -   \`category\`: The primary academic category (e.g., Engineering, Medical, Arts).
        -   \`state\`: The state where the institution is located.
        -   \`city\`: The city or district where the institution is located.
        -   \`address\`: The full postal address.
        -   \`website\`: The official website (if available).
        -   \`approval_body\`: The main approval body (e.g., UGC, AICTE, NMC).
    -   Return a JSON object with a single key, \`colleges\`, containing an array of these institution objects. If no institutions are found, return an empty array.
`,
});

// AI Flow: This function orchestrates the call to the AI model.
// No caching is implemented to ensure stability and prevent server errors.
const findNearbyCollegesFlow = ai.defineFlow(
  {
    name: 'findNearbyCollegesFlow',
    inputSchema: FindNearbyCollegesInputSchema,
    outputSchema: FindNearbyCollegesOutputSchema,
  },
  async (input) => {
    // Directly call the AI with the provided input.
    const { output } = await prompt(input);
    // Return the output, or an empty array if the output is null/undefined.
    return output || { colleges: [] };
  }
);
