'use server';

/**
 * @fileOverview Autonomous AI Scraper for Indian Colleges.
 * This file defines a Genkit flow that uses an AI prompt to search the web
 * for Indian colleges based on specified filters, enriches the data,
 * and saves it directly to the 'collegesMaster' collection in Firestore.
 *
 * - autoScrapeAndSave - Main function to trigger the scraping and saving process.
 * - searchColleges - A function to search the existing Firestore data.
 */

import { ai } from '@/ai/genkit';
import { gemini15Flash } from '@genkit-ai/googleai';
import { z } from 'genkit';
import { firestore } from '@/lib/firebase-admin';
import type { CollectionReference, Query } from 'firebase-admin/firestore';


// ------------------ INPUT / OUTPUT SCHEMAS ------------------

const CollegeSearchInputSchema = z.object({
  query: z.string().optional().describe("User's text input for searching existing data."),
  state: z.string().optional().describe("The Indian state to filter by."),
  ownership: z.enum(['government', 'private', 'All']).optional().describe("The ownership type of the institution."),
  category: z.string().optional().describe("The academic category to filter by."),
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

const ScrapeOutputSchema = z.object({
  colleges: z.array(CollegeSchema),
});

const CollegeSearchOutputSchema = z.object({
  colleges: z.array(CollegeSchema),
  isDbEmpty: z.boolean().optional(),
});
export type CollegeSearchOutput = z.infer<typeof CollegeSearchOutputSchema>;


// ------------------ AUTONOMOUS SCRAPER FLOW ------------------

const scrapeAndEnrichPrompt = ai.definePrompt({
  name: 'scrapeAndEnrichPrompt',
  model: gemini15Flash,
  input: { schema: CollegeSearchInputSchema },
  output: { schema: ScrapeOutputSchema },
  prompt: `
You are an AI web-scraper + data enricher.
Search the web for Indian colleges/universities that match the filters:
- State: {{{state}}}
- Ownership: {{{ownership}}}
- Category: {{{category}}}

Return a JSON array "colleges" with full details:
id, name, type (college/university/institute), ownership (government/private),
category, state, city, address, website, approval_body, aliases.

Make sure data is accurate, official, and enriched from reliable sources (AICTE, UGC, NIRF, Wikipedia).
Ensure IDs are unique.
No free text, only valid JSON.
`
});


export async function autoScrapeAndSave(input: CollegeSearchInput) {
  try {
    const { output } = await scrapeAndEnrichPrompt(input);
    const colleges = output!.colleges;

    const batch = firestore.batch();
    colleges.forEach((college) => {
      const ref = firestore.collection('collegesMaster').doc(college.id.toString());
      batch.set(ref, college, { merge: true });
    });

    await batch.commit();
    return { success: true, count: colleges.length };
  } catch (err: any) {
    console.error('❌ Auto scrape failed:', err);
    return { success: false, error: err.message };
  }
}

// ------------------- LEGACY SEARCH FLOW (to search existing data) -------------------

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
    // First, check if the collection is empty to provide a better user experience.
    const collectionRef = firestore.collection('collegesMaster');
    const collectionCheck = await collectionRef.limit(1).get();
    if (collectionCheck.empty) {
        console.warn("⚠️ Firestore collection 'collegesMaster' is empty. You may need to seed the database.");
        return { colleges: [], isDbEmpty: true };
    }
    
    let query: Query | CollectionReference = collectionRef;

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
      let allMatches = snapshot.docs.map(doc => doc.data() as z.infer<typeof CollegeSchema>);

      // If there's a text query, apply in-memory filtering.
      if (input.query) {
        const searchTerm = input.query.toLowerCase();
        allMatches = allMatches.filter(college => {
            const nameMatch = college.name.toLowerCase().includes(searchTerm);
            const cityMatch = college.city.toLowerCase().includes(searchTerm);
            const aliasMatch = college.aliases?.some(alias => alias.toLowerCase().includes(searchTerm));
            return nameMatch || cityMatch || aliasMatch;
        });
      }

      return { colleges: allMatches, isDbEmpty: false };

    } catch (error: any) {
        console.error('❌ Firestore query failed:', error);
        const errorMessage = error.details || error.message || 'An unexpected error occurred while querying the database.';
        throw new Error(errorMessage);
    }
  }
);
