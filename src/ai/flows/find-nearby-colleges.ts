'use server';

/**
 * @fileOverview Live AI Scraper for Indian Colleges with pagination support.
 */

import { ai } from '@/ai/genkit';
import { gemini15Flash } from '@genkit-ai/googleai';
import { z } from 'genkit';

// ------------------ SCHEMAS ------------------

const CollegeSearchInputSchema = z.object({
  state: z.string().describe("Indian state to fetch colleges for."),
  ownership: z.enum(['government', 'private', 'All']).optional(),
  category: z.string().optional(),
  pageToken: z.string().optional(),
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
Your task: Fetch ALL colleges/universities in the Indian state {{{state}}} matching ownership {{{ownership}}}.
Ignore category. Return everything you can find, even if it takes multiple pages.
Use reliable sources (AICTE, UGC, NIRF, Wikipedia).
Return ONLY valid JSON: { "colleges": [...], "nextPageToken": "..." }
Ensure unique IDs for each college.
Do not truncate results; paginate using pageToken.
`
});

export async function searchCollegesLive(input: CollegeSearchInput): Promise<CollegeSearchOutput> {
  try {
    const allColleges: z.infer<typeof CollegeSchema>[] = [];
    let pageToken: string | undefined = undefined;
    let hasMore = true;
    let pageCount = 0;

    while (hasMore) {
      pageCount++;
      const { output } = await liveScrapePrompt({ ...input, pageToken });
      if (!output || !output.colleges) break;

      allColleges.push(...output.colleges);
      pageToken = output.nextPageToken;
      hasMore = !!pageToken;

      // Safety limit to prevent infinite loops
      if (pageCount > 20) break;
    }

    // Deduplicate by name + city
    const uniqueColleges = Array.from(
      new Map(allColleges.map(c => [`${c.name}-${c.city}`, c])).values()
    );

    return { colleges: uniqueColleges };
  } catch (err: any) {
    console.error('Live AI scrape failed:', err);
    return { colleges: [] };
  }
}
