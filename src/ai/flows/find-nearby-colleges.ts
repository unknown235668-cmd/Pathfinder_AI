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
import { MODELS } from '@/ai/genkit';
import { z } from 'genkit';
import { firestore } from '@/lib/firebase-admin';
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
  colleges: z.array(CollegeSchema)
});
export type CollegeSearchOutput = z.infer<typeof CollegeSearchOutputSchema>;

// ------------------- AI NORMALIZATION FLOW (with retry logic) -------------------

const NormalizeInputSchema = z.object({ query: z.string() });
const NormalizeOutputSchema = z.object({ normalizedQuery: z.string() });

// Define the prompt separately to be used in the retry loop.
const normalizeCollegeQueryPrompt = ai.definePrompt({
  name: 'normalizeCollegeQueryPrompt',
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


// This flow executes the normalization prompt and includes retry logic.
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

    let attempts = 0;
    for (const model of MODELS) {
        try {
            console.log(`🟢 Normalizing query with model: ${model}`);
            const dynamicPrompt = ai.definePrompt({ ...normalizeCollegeQueryPrompt, model });
            const output = await dynamicPrompt(input);
            return output;
        } catch (err: any) {
            const isRetryableError =
                (err.status && (err.status === 429 || err.status >= 500)) ||
                (err.code && err.code === 'quota_exceeded') ||
                (err.message && (err.message.includes('429') || err.message.includes('quota') || err.message.includes('500')));

            if (isRetryableError && attempts < MODELS.length -1) {
                 console.warn(`⚠️ Retryable error for ${model}. Trying next model...`);
                 attempts++;
            } else {
                 console.error('❌ Non-retryable error or all models failed:', err);
                 throw err; // Re-throw the last error
            }
        }
    }
    // This should not be reached if the loop is correct, but as a fallback:
    throw new Error('🚨 All Gemini models failed normalization or exceeded free tier quota.');
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
    const { normalizedQuery } = await normalizeQueryFlow({ query: input.query || "" });
    const searchTerm = normalizedQuery.toLowerCase();

    let query: Query | CollectionReference = firestore.collection('collegesMaster');

    if (input.state) {
      query = query.where('state', '==', input.state);
    }
    if (input.ownership && input.ownership !== 'All') {
      query = query.where('ownership', '==', input.ownership.toLowerCase());
    }
    if (input.category) {
      query = query.where('category', '==', input.category);
    }

    const snapshot = await query.get();

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
