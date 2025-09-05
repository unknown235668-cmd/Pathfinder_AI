'use server';

import { ai } from '@/ai/genkit';
import { gemini15Flash } from '@genkit-ai/googleai';
import { z } from 'genkit';

const CollegeSearchInputSchema = z.object({
  state: z.string().describe("Indian state to fetch colleges"),
  ownership: z.enum(['government', 'private', 'All']).optional(),
  pageToken: z.string().optional(), // For pagination
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

const liveScrapePrompt = ai.definePrompt({
  name: 'liveScrapePrompt',
  model: gemini15Flash,
  input: { schema: CollegeSearchInputSchema },
  output: { schema: ScrapeOutputSchema },
  prompt: `
You are an AI web-scraper + data enricher.
Fetch colleges/universities in state {{{state}}} matching ownership {{{ownership}}}.
Return **only 6 colleges per response**.
Return JSON: { "colleges": [...], "nextPageToken": "..." }
Ensure unique IDs and valid JSON. Use reliable sources (AICTE, UGC, NIRF, Wikipedia). 
Do not repeat colleges that were in previous pages.
`
});

export async function searchCollegesLive(input: CollegeSearchInput): Promise<CollegeSearchOutput> {
  try {
    const { output } = await liveScrapePrompt(input);
    if (!output) return { colleges: [], nextPageToken: undefined };
    return output;
  } catch (err: any) {
    console.error('Live scrape error:', err);
    return { colleges: [], nextPageToken: undefined };
  }
}
