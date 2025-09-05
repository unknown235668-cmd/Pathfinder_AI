'use server';

/**
 * @fileOverview Live AI Scraper for Indian Colleges with Pagination.
 * This file defines a Genkit flow that uses an AI prompt to search the web
 * in real-time for Indian colleges, handling large result sets through pagination.
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
  pageToken: z.string().optional().describe("Token for fetching the next page of results."),
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
  nextPageToken: z.string().optional().describe("Token to fetch the next batch of results. Omit if there are no more."),
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
- Page Token: {{{pageToken}}} (used for pagination; if none, start from beginning)

Return a JSON object:
{
  "colleges": [...], // list of college objects with full details
  "nextPageToken": "..." // token to fetch the next batch; omit if no more results
}

Make sure each college has a unique ID. Use reliable sources (AICTE, UGC, NIRF, Wikipedia). Return valid JSON only.
`
});


async function fetchCollegePage(input: CollegeSearchInput): Promise<CollegeSearchOutput> {
  try {
    console.log("🚀 Performing live paginated AI scrape with initial input:", input);
    
    const allColleges: z.infer<typeof CollegeSchema>[] = [];
    let pageToken: string | undefined = input.pageToken;
    let pageCount = 0;
  
    do {
      pageCount++;
      console.log(`- Fetching page ${pageCount}... (Token: ${pageToken || 'none'})`);
      const { output } = await liveScrapePrompt({ ...input, pageToken });
      
      if (!output) {
        console.log("- AI returned no output. Ending scrape.");
        break;
      }
  
      if(output.colleges && output.colleges.length > 0) {
        allColleges.push(...output.colleges);
        console.log(`  - Found ${output.colleges.length} colleges on this page. Total so far: ${allColleges.length}`);
      } else {
        console.log(`- No colleges found on page ${pageCount}.`);
      }
      
      pageToken = output.nextPageToken;
  
    } while (pageToken);
  
    console.log(`- Total pages scraped: ${pageCount}.`);
    
    // Remove duplicates by name and city to get a clean list
    const uniqueColleges = Array.from(new Map(allColleges.map(c => [`${c.name}-${c.city}`, c])).values());
    console.log(`✅ Live scrape complete. Total unique colleges found: ${uniqueColleges.length}.`);
  
    return { colleges: uniqueColleges, nextPageToken: pageToken };

  } catch (err: any) {
    console.error('❌ Live AI scrape failed during pagination:', err);
    // In case of a failure, return an empty array to prevent UI crash.
    return { colleges: [] };
  }
}

export async function searchCollegesLive(input: CollegeSearchInput): Promise<CollegeSearchOutput> {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    let allColleges: z.infer<typeof CollegeSchema>[] = [];
  
    // We are going to ignore the page token from the client here and manage it internally
    const startLetter = input.pageToken ? input.pageToken.charAt(0).toUpperCase() : 'A';
    const letterIndex = letters.indexOf(startLetter);

    if (letterIndex === -1) {
      return { colleges: [] }; // Invalid page token
    }
    
    // Process one letter at a time to act as a "page"
    const letter = letters[letterIndex];

    try {
      console.log(`🚀 Fetching colleges starting with "${letter}"...`);
      // Use the internal fetchCollegePage which doesn't do the alphabet iteration
      const { colleges } = await fetchCollegePage({
        ...input,
        query: `${input.query || ''} ${letter}`,  // chunk by first letter
        pageToken: undefined // Don't pass the letter-based token to the AI
      });

      // merge, remove duplicates
      for (const c of colleges) {
        if (!allColleges.some(existing => existing.name === c.name && existing.city === c.city)) {
          allColleges.push(c);
        }
      }
    } catch (err) {
      console.warn(`⚠️ Failed for letter ${letter}:`, err);
    }
  
    const nextLetterIndex = letterIndex + 1;
    const nextPageToken = nextLetterIndex < letters.length ? letters[nextLetterIndex] : undefined;

    console.log(`✅ Total unique colleges found for letter ${letter}: ${allColleges.length}`);
    return { colleges: allColleges, nextPageToken };
  }
