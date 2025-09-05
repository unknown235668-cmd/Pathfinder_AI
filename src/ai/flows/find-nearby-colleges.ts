
'use server';

/**
 * @fileOverview Live AI Scraper for Indian Colleges with pagination support.
 */

import { ai } from '@/ai/genkit';
import { gemini15Flash } from '@genkit-ai/googleai';
import { z } from 'genkit';

// ------------------ SCHEMAS ------------------

const CollegeSearchInputSchema = z.object({
  query: z.string().optional(),
  state: z.string().optional(),
  ownership: z.enum(['government', 'private', 'All']).optional(),
  category: z.string().optional(),
  pageToken: z.string().optional(), // for AI pagination
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
  nextPageToken: z.string().optional(),
});
export type CollegeSearchOutput = z.infer<typeof ScrapeOutputSchema>;

// ------------------ LIVE AI SCRAPER FLOW ------------------

const liveScrapePrompt = ai.definePrompt({
  name: 'liveScrapePrompt',
  model: gemini15Flash,
  input: { schema: CollegeSearchInputSchema },
  output: { schema: ScrapeOutputSchema },
  prompt: `
You are an AI web-scraper + data enricher.
Search the web in real-time for Indian colleges/universities matching the filters:
- Query: {{{query}}}
- State: {{{state}}}
- Ownership: {{{ownership}}}
- Category: {{{category}}}
- Page Token: {{{pageToken}}} (for pagination, if none start from beginning)

Return a JSON object:
{
  "colleges": [...], 
  "nextPageToken": "..." // omit if no more pages
}
Ensure each college has unique ID. Sources: AICTE, UGC, NIRF, Wikipedia. Return valid JSON only.
`,
});

export async function searchCollegesLive(input: CollegeSearchInput): Promise<CollegeSearchOutput> {
  try {
    let allColleges: z.infer<typeof CollegeSchema>[] = [];
    let pageToken: string | undefined = input.pageToken;
    let hasMore = true;

    while (hasMore) {
      const { output } = await liveScrapePrompt({ ...input, pageToken });

      if (!output || !output.colleges) break;

      allColleges.push(...output.colleges);

      if (output.nextPageToken) {
        pageToken = output.nextPageToken;
      } else {
        hasMore = false;
      }
    }

    // Remove duplicates by name + city
    const uniqueColleges = Array.from(
      new Map(allColleges.map(c => [`${c.name}-${c.city}`, c])).values()
    );

    return { colleges: uniqueColleges };
  } catch (err: any) {
    console.error('❌ Live AI scrape failed:', err);
    return { colleges: [] };
  }
}
