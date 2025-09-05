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
Search the web in real-time for ALL Indian colleges/universities that match the filters:
- State: {{{state}}} (mandatory)
- Ownership: {{{ownership}}} (government/private/All)
- Category: {{{category}}} (if provided)
- Query: {{{query}}} (optional)

Return a JSON array "colleges" with full details for ALL matching institutions:
id, name, type (college/university/institute), ownership (government/private),
category, state, city, address, website, approval_body, aliases.

Fetch all available results — DO NOT limit. If no results, return an empty array.
Ensure data is accurate, official, enriched from AICTE, UGC, NIRF, Wikipedia.
IDs must be unique.
Only valid JSON, no free text.
`
});


export async function searchCollegesLive(input: CollegeSearchInput): Promise<CollegeSearchOutput> {
  try {
    console.log("🚀 Performing live AI scrape for ALL colleges with input:", input);
    const { output } = await liveScrapePrompt(input);

    if (!output) {
      console.warn("AI scrape returned no output.");
      return { colleges: [] };
    }
    
    // Assign unique IDs if AI did not
    const collegesWithId = output.colleges.map((c: any, idx: number) => ({ ...c, id: c.id || idx + 1 }));

    console.log(`✅ Live scrape found ${collegesWithId.length} colleges.`);
    return { colleges: collegesWithId };
    
  } catch (err: any) {
    console.error('❌ Live AI scrape failed:', err);
    // In case of a failure in the AI flow, return an empty array to prevent UI crash.
    return { colleges: [] };
  }
}
