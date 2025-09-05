'use server';

/**
 * @fileOverview Dynamic Indian Colleges Locator
 * This file defines the backend logic for searching colleges.
 * It uses a hybrid approach:
 * 1. An AI flow (`normalizeQueryFlow`) normalizes the user's text query with retry logic.
 * 2. The main flow (`searchCollegesFlow`) queries Firestore with primary filters
 *    (state, ownership, category) and then applies the normalized text search
 *    in-memory to allow for flexible searching across multiple fields (name, city, aliases).
 */

import { ai } from '@/ai/genkit';
import { gemini15Flash } from '@genkit-ai/googleai';
import { z } from 'genkit';
import type { CollectionReference, Query } from 'firebase-admin/firestore';

// ------------------- INPUT / OUTPUT SCHEMAS -------------------

const CollegeSearchInputSchema = z.object({
  query: z.string().optional().describe("User's text input: can be a college name, alias, city, or partial name."),
  ownership: z.enum(['government', 'private', 'All']).optional().describe("The ownership type of the institution."),
  category: z.string().optional().describe("The academic category to filter by."),
  state: z.string().optional().describe("The Indian state to filter by."),
});
export type CollegeSearchInput = z.infer<typeof CollegeSearchInputSchema>;

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

const CollegeSearchOutputSchema = z.object({
  colleges: z.array(CollegeSchema),
  isDbEmpty: z.boolean().optional(),
});
export type CollegeSearchOutput = z.infer<typeof CollegeSearchOutputSchema>;

// ------------------- AI NORMALIZATION FLOW (with retry logic) -------------------

const NormalizeInputSchema = z.object({ query: z.string() });
const NormalizeOutputSchema = z.object({ normalizedQuery: z.string() });

const normalizeCollegeQueryPrompt = ai.definePrompt({
  name: 'normalizeCollegeQueryPrompt',
  model: gemini15Flash,
  input: { schema: NormalizeInputSchema },
  output: { schema: NormalizeOutputSchema },
  prompt: `You are an expert Indian education data assistant. Your task is to normalize a user's search query to improve search accuracy.
- The user might enter a college name, an alias (e.g., IITM, BHU), a city, a state, or a category.
- Normalize the input to its most likely official name or search term.
- Examples: "Trichy" -> "Tiruchirappalli", "IITM" -> "Indian Institute of Technology Madras", "BHU" -> "Banaras Hindu University", "Best engineering colleges" -> "Engineering"
- Return ONLY the normalized string in a JSON object.
- User Input: {{{query}}}
`
});

const normalizeQueryFlow = ai.defineFlow(
  {
    name: 'normalizeQueryFlow',
    inputSchema: NormalizeInputSchema,
    outputSchema: NormalizeOutputSchema,
  },
  async (input) => {
    if (!input.query) {
      return { normalizedQuery: "" };
    }

    try {
        const {output} = await normalizeCollegeQueryPrompt(input);
        return output!;
    } catch (err: any) {
        console.error('❌ Normalization failed:', err);
        // Fallback to using the raw query if normalization fails
        return { normalizedQuery: input.query };
    }
  }
);


// ------------------- MAIN SEARCH FLOW -------------------

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
    const { firestore } = await import('@/lib/firebase-admin');

    const { normalizedQuery } = await normalizeQueryFlow({ query: input.query || "" });
    const searchTerm = normalizedQuery.toLowerCase();

    let query: Query | CollectionReference = firestore.collection('collegesMaster');

    // First, check if the collection is empty to provide a better user experience.
    const collectionCheck = await firestore.collection('collegesMaster').limit(1).get();
    if (collectionCheck.empty) {
        console.warn("⚠️ Firestore collection 'collegesMaster' is empty. You may need to seed the database.");
        return { colleges: [], isDbEmpty: true };
    }

    // Apply primary filters that are likely to be indexed.
    if (input.state) {
      query = query.where('state', '==', input.state);
    }
    if (input.ownership && input.ownership !== 'All') {
      query = query.where('ownership', '==', input.ownership.toLowerCase());
    }
    if (input.category) {
      query = query.where('category', '==', input.category);
    }

    try {
      const snapshot = await query.get();
      const allMatches = snapshot.docs.map(doc => doc.data() as z.infer<typeof CollegeSchema>);

      // If no text query, return all pre-filtered results.
      if (!searchTerm) {
        return { colleges: allMatches, isDbEmpty: false };
      }

      // Apply secondary, in-memory filtering for text search.
      const filteredColleges = allMatches.filter(college => {
          const nameMatch = college.name.toLowerCase().includes(searchTerm);
          const cityMatch = college.city.toLowerCase().includes(searchTerm);
          const aliasMatch = college.aliases?.some(alias => alias.toLowerCase().includes(searchTerm));
          return nameMatch || cityMatch || aliasMatch;
      });

      return { colleges: filteredColleges, isDbEmpty: false };

    } catch (error: any) {
        // This will catch other errors, like missing composite indexes.
        console.error('❌ Firestore query failed:', error);
        // Propagate a more descriptive error to the client.
        const errorMessage = error.details || error.message || 'An unexpected error occurred while querying the database.';
        throw new Error(errorMessage);
    }
  }
);
