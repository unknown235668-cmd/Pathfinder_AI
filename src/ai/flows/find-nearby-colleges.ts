'use server';

/**
 * @fileOverview Live AI Scraper for Indian Colleges.
 * This file defines a Genkit flow that uses an AI prompt to search the web
 * in real-time for Indian colleges based on specified filters.
 *
 * - searchCollegesLive - The main function that triggers the live scraping process.
 */

import { ai } from '@/ai/genkit';
import { gemini15Flash } from '@genkit-ai/googleai';
import { z } from 'genkit';

// ------------------ INPUT / OUTPUT SCHEMAS ------------------

const CollegeSearchInputSchema = z.object({
  query: z.string().optional().describe("User's text input for searching."),
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
});
export type CollegeSearchOutput = z.infer<typeof CollegeSearchOutputSchema>;


// ------------------ LIVE AI SCRAPER FLOW ------------------

const liveScrapePrompt = ai.definePrompt({
  name: 'liveScrapePrompt',
  model: gemini15Flash,
  input: { schema: CollegeSearchInputSchema },
  output: { schema: ScrapeOutputSchema },
  prompt: `
You are an AI web-scraper + data enricher.
Search the web in real-time for Indian colleges/universities that match the query and filters:
- Search Query: {{{query}}}
- State: {{{state}}}
- Ownership: {{{ownership}}}
- Category: {{{category}}}

Return a JSON array "colleges" with full details:
id, name, type (college/university/institute), ownership (government/private),
category, state, city, address, website, approval_body, aliases.

Make sure data is accurate, official, and enriched from reliable sources (AICTE, UGC, NIRF, Wikipedia).
Ensure IDs are unique.
No free text, only valid JSON. If you find no results, return an empty "colleges" array.
`
});


export async function searchCollegesLive(input: CollegeSearchInput): Promise<CollegeSearchOutput> {
  try {
    console.log("🚀 Performing live AI scrape with input:", input);
    const { output } = await liveScrapePrompt(input);

    if (!output) {
      console.warn("AI scrape returned no output.");
      return { colleges: [] };
    }

    console.log(`✅ Live scrape found ${output.colleges.length} colleges.`);
    return { colleges: output.colleges };
    
  } catch (err: any) {
    console.error('❌ Live AI scrape failed:', err);
    // In case of a failure in the AI flow, return an empty array to prevent UI crash.
    return { colleges: [] };
  }
}
