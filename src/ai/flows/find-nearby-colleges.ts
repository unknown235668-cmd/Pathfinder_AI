'use server';

/**
 * @fileOverview Live AI Scraper for Indian Colleges with pagination support.
 */

import { ai } from '@/ai/genkit';
import { gemini15Flash } from '@genkit-ai/googleai';
import { z } from 'genkit';

// ------------------ SCHEMAS ------------------

const CollegeSearchInputSchema = z.object({
  state: z.string().optional(),
  ownership: z.enum(['government', 'private', 'All']).optional(),
  category: z.string().optional(),
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
  aliases: z.array(z.string()).optional(),
});

const ScrapeOutputSchema = z.object({
  colleges: z.array(CollegeSchema),
});
export type CollegeSearchOutput = z.infer<typeof ScrapeOutputSchema>;

const liveScrapePrompt = ai.definePrompt({
  name: 'liveScrapePrompt',
  model: gemini15Flash,
  input: { schema: CollegeSearchInputSchema },
  output: { schema: ScrapeOutputSchema },
  prompt: `
You are an AI web-scraper for Indian colleges. 

- Ignore result limits. Fetch **all colleges** for the given state, ownership, and category. 
- Use official sources (AICTE, UGC, NIRF, Wikipedia). 
- Return **full JSON array** with:
  id, name, type, ownership, category, state, city, address, website, approval_body, aliases.
- Ensure **unique IDs**. No free text, only valid JSON.

State: {{{state}}}
Ownership: {{{ownership}}}
Category: {{{category}}}
`
});

export async function searchCollegesLive(input: CollegeSearchInput): Promise<CollegeSearchOutput> {
  try {
    console.log("🚀 Brute-forcing all colleges for state:", input.state);

    const { output } = await liveScrapePrompt(input);

    if (!output || !output.colleges || !output.colleges.length) {
      console.warn("❌ No colleges found for state:", input.state);
      return { colleges: [] };
    }

    // Remove duplicates by name+city
    const uniqueColleges = Array.from(
      new Map(output.colleges.map(c => [`${c.name}-${c.city}`, c])).values()
    );

    console.log(`✅ Found ${uniqueColleges.length} colleges for state ${input.state}`);
    return { colleges: uniqueColleges };
  } catch (err: any) {
    console.error('❌ Live AI scrape failed:', err);
    return { colleges: [] };
  }
}
