
'use server';

/**
 * @fileOverview Finds nearby government or private colleges by using a generative AI model.
 * The flow dynamically generates a list of institutions based on user-provided filters.
 *
 * - findNearbyColleges - A function that returns a list of colleges based on filters.
 * - FindNearbyCollegesInput - The input type for the findNearbyColleges function.
 * - FindNearbyCollegesOutput - The return type for the findNearbyColleges function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema: Defines the filters the frontend can send.
const FindNearbyCollegesInputSchema = z.object({
  state: z.string().optional().describe('An Indian state to filter by.'),
  city: z.string().optional().describe('A universal search query for city, state, or institution name/alias.'),
  category: z.string().optional().describe('An optional category to filter colleges (e.g., engineering, medical).'),
  typeFilter: z.string().optional().describe('The type of institution to filter by: "government", "private", or "All".')
});
export type FindNearbyCollegesInput = z.infer<typeof FindNearbyCollegesInputSchema>;


// Define the structure for a single college, which aligns with the JSON data.
const CollegeSchema = z.object({
    id: z.number().describe("A unique ID for the institution."),
    name: z.string().describe("The official name of the institution."),
    type: z.enum(["college", "university", "institute"]).describe("The type of institution."),
    ownership: z.enum(["government", "private"]).describe("Whether the institution is government-run or private."),
    category: z.string().describe("The primary academic category (e.g., Engineering, Medical, Arts)."),
    state: z.string().describe("The Indian state where the institution is located."),
    city: z.string().describe("The city where the institution is located."),
    address: z.string().describe("The full postal address of the institution."),
    website: z.string().optional().describe("The official website of the institution."),
    approval_body: z.string().describe("The primary approval body (e.g., UGC, AICTE, NMC)."),
    aliases: z.array(z.string()).optional().describe("Common aliases or abbreviations for the institution."),
  });
  

// Output Schema: Defines the structure of the flow's response.
const FindNearbyCollegesOutputSchema = z.object({
  colleges: z.array(CollegeSchema).describe("An array of institutions matching the filter criteria.")
});
export type FindNearbyCollegesOutput = z
  .infer<typeof FindNearbyCollegesOutputSchema>;


// This is the main function the frontend will call.
export async function findNearbyColleges(
  input: FindNearbyCollegesInput
): Promise<FindNearbyCollegesOutput> {
  return findNearbyCollegesFlow(input);
}

const prompt = ai.definePrompt({
    name: 'findNearbyCollegesPrompt',
    input: { schema: FindNearbyCollegesInputSchema },
    output: { schema: FindNearbyCollegesOutputSchema },
    prompt: `You are an expert assistant for Indian education data. Your task is to dynamically fetch and list all colleges, universities, and institutes based on the user's query.

    Instructions:
    1.  **Analyze Filters**:
        -   The primary filter is 'typeFilter'. You must only return institutions that match this type ('government', 'private', or 'All').
        -   If a 'state' is provided, filter results for that state.
        -   If a 'city' is provided, treat it as a search query. Match it against the institution's name, city, state, or aliases.
        -   If a 'category' is provided, further filter the results to ONLY institutions matching that category.

    2.  **Data Generation**:
        -   Return ALL institutions that match the user's filters. Do not truncate the list.
        -   If the query is for a large region like a full state, you must return all matching institutions, even if there are hundreds.
        -   Include all types of institutions: Central/State Universities, IITs, NITs, IIITs, AIIMS, government medical colleges, polytechnics, vocational institutes, and private colleges.
        -   Assign a unique 'id' for each institution.

    3.  **Normalization**:
        -   Normalize location names (e.g., "Trichy" -> "Tiruchirappalli").
        -   Recognize and match common aliases (e.g., "IITB" -> "Indian Institute of Technology Bombay").

    4.  **Output**:
        -   Format the output as a JSON object with a single key "colleges", containing an array of institution objects.
        -   If no institutions are found, return an empty "colleges" array.

    User Query:
    -   State: {{{state}}}
    -   Search Term (City/Name/Alias): {{{city}}}
    -   Ownership Type: {{{typeFilter}}}
    -   Category: {{{category}}}
    `,
});

// AI Flow: This function orchestrates the data filtering.
// It queries the master JSON data instead of calling a generative AI model.
const findNearbyCollegesFlow = ai.defineFlow(
  {
    name: 'findNearbyCollegesFlow',
    inputSchema: FindNearbyCollegesInputSchema,
    outputSchema: FindNearbyCollegesOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
        throw new Error("The AI model failed to return a valid response.");
    }
    return output;
  }
);
