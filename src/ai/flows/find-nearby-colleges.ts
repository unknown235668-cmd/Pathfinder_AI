'use server';

/**
 * @fileOverview Dynamic Indian Colleges Locator
 * This file defines the backend logic for searching colleges.
 * It uses a hybrid approach:
 * 1. An AI flow (`normalizeFlow`) normalizes the user's text query.
 * 2. The main flow (`searchCollegesFlow`) queries Firestore with primary filters 
 *    (state, ownership, category) and then applies the normalized text search
 *    in-memory to allow for flexible searching across multiple fields (name, city, aliases).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { firestore } from '@/lib/firebase';
import { CollectionReference, Query } from 'firebase-admin/firestore';

// ------------------- INPUT / OUTPUT SCHEMAS -------------------

// Input schema for the main search flow.
const CollegeSearchInputSchema = z.object({
  query: z.string().optional().describe("User's text input: can be a college name, alias, city, or partial name."),
  ownership: z.enum(['government', 'private', 'All']).optional().describe("The ownership type of the institution."),
  category: z.string().optional().describe("The academic category to filter by."),
  state: z.string().optional().describe("The Indian state to filter by."),
});
export type CollegeSearchInput = z.infer<typeof CollegeSearchInputSchema>;

// Defines the structure of a single college object.
const CollegeSchema = z.object({
    id: z.number(),
    name: z.string(),
    type: z.enum(['college', 'university', 'institute']),
    ownership: z.enum(['government', 'private']),
    category: z.string(),
    state: z.string(),
    city: z.string(),
    address: z.string(),
    website: z.string().optional(),
    approval_body: z.string(),
    aliases: z.array(z.string()).optional()
});

// Output schema: a list of colleges.
const CollegeSearchOutputSchema = z.object({
  colleges: z.array(CollegeSchema)
});
export type CollegeSearchOutput = z.infer<typeof CollegeSearchOutputSchema>;

// ------------------- AI NORMALIZATION FLOW -------------------

// This prompt instructs the AI to normalize a user's search query.
// For example, it can expand abbreviations (IITM -> Indian Institute of Technology Madras)
// or correct spellings/locations (Trichy -> Tiruchirappalli).
const normalizePrompt = ai.definePrompt({
  name: 'normalizeCollegeQueryPrompt',
  input: { schema: z.object({ query: z.string() }) },
  output: { schema: z.object({ normalizedQuery: z.string() }) },
  prompt: `You are an expert Indian education data assistant. Your task is to normalize a user's search query to improve search accuracy.
- The user might enter a college name, an alias (e.g., IITM, BHU), a city, a state, or a category.
- Normalize the input to its most likely official name or search term.
- Examples: "Trichy" -> "Tiruchirappalli", "IITM" -> "Indian Institute of Technology Madras", "BHU" -> "Banaras Hindu University", "Best engineering colleges" -> "Engineering"
- Return ONLY the normalized string in a JSON object.
- User Input: {{{query}}}
`
});

// This flow executes the normalization prompt. It's a helper for the main search flow.
const normalizeQueryFlow = ai.defineFlow(
  {
    name: 'normalizeQueryFlow',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.object({ normalizedQuery: z.string() }),
  },
  async (input) => {
    if (!input.query) {
      return { normalizedQuery: "" };
    }
    const { output } = await normalizePrompt(input);
    return output!;
  }
);

// ------------------- MAIN SEARCH FLOW -------------------

/**
 * This is the main function the frontend calls. It orchestrates the search process.
 * Renamed from findNearbyColleges to better reflect its universal search capability.
 */
export async function searchColleges(input: CollegeSearchInput): Promise<CollegeSearchOutput> {
  return searchCollegesFlow(input);
}

const searchCollegesFlow = ai.defineFlow(
  {
    name: 'searchCollegesFlow',
    inputSchema: CollegeSearchInputSchema,
    outputSchema: CollegeSearchOutputSchema,
  },
  async (input) => {
    // Step 1: Get the normalized search query from the AI helper flow.
    const { normalizedQuery } = await normalizeQueryFlow({ query: input.query || "" });
    const searchTerm = normalizedQuery.toLowerCase();

    // Step 2: Build the base Firestore query with the most restrictive filters.
    // This is more efficient than fetching the entire collection.
    let query: Query | CollectionReference = firestore.collection('collegesMaster');

    if (input.state) {
      query = query.where('state', '==', input.state);
    }
    if (input.ownership && input.ownership !== 'All') {
      // Note: Firestore requires `where` clause values to be lowercase to match the data.
      query = query.where('ownership', '==', input.ownership.toLowerCase());
    }
    if (input.category) {
      query = query.where('category', '==', input.category);
    }

    const snapshot = await query.get();

    // Step 3: Perform the text search and alias matching in memory.
    // This is more flexible than Firestore's native search and avoids query limitations.
    const allMatches = snapshot.docs.map(doc => doc.data() as z.infer<typeof CollegeSchema>);

    if (!searchTerm) {
        return { colleges: allMatches };
    }

    const filteredColleges = allMatches.filter(college => {
        const nameMatch = college.name.toLowerCase().includes(searchTerm);
        const cityMatch = college.city.toLowerCase().includes(searchTerm);
        const aliasMatch = college.aliases?.some(alias => alias.toLowerCase().includes(searchTerm));

        return nameMatch || cityMatch || aliasMatch;
    });

    return { colleges: filteredColleges };
  }
);
