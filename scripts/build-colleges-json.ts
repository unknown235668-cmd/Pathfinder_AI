
'use server';

import { config } from 'dotenv';
config(); // Load environment variables from .env

import fs from 'fs';
import { ai } from '@/ai/genkit';
import { gemini15Flash } from '@genkit-ai/googleai';
import { z } from 'genkit';

const CollegeSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string(),
  ownership: z.string(),
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


const scrapeCollegesPrompt = ai.definePrompt({
  name: 'scrapeCollegesPrompt',
  model: gemini15Flash,
  input: { schema: z.object({ url: z.string() }) },
  output: { schema: ScrapeOutputSchema },
  prompt: `
Scrape data from: {{{url}}}.
Extract only structured Indian college/university data.
Return valid JSON only in the format defined in the output schema.
Ensure id is a unique number.
`
});

export async function buildIndianCollegesJson() {
  console.log("Starting to build indian_colleges.json from authoritative sources...");
  const urls = [
    "https://www.aicte-india.org/approved-institutes",
    "https://www.ugc.ac.in/stateuniversitylist.aspx",
    "https://www.nirfindia.org/2025/Ranking.html"
  ];

  let allColleges: z.infer<typeof CollegeSchema>[] = [];
  
  for (const url of urls) {
    try {
      console.log(`Scraping from ${url}...`);
      const { output } = await scrapeCollegesPrompt({ url });
      
      if (output?.colleges?.length) {
        console.log(`- Found ${output.colleges.length} colleges.`);
        allColleges.push(...output.colleges);
      } else {
        console.log(`- No colleges found at ${url}.`);
      }
    } catch (err) {
      console.error(`❌ Scrape failed for ${url}`, err);
    }
  }

  // Basic deduplication
  const uniqueColleges = Array.from(new Map(allColleges.map(c => [`${c.name}-${c.city}`, c])).values());
  
  console.log(`Total colleges found: ${allColleges.length}. Unique colleges: ${uniqueColleges.length}.`);

  fs.writeFileSync('indian_colleges.json', JSON.stringify(uniqueColleges, null, 2));
  
  console.log(`✅ Successfully created indian_colleges.json with ${uniqueColleges.length} colleges.`);
  return { count: uniqueColleges.length };
}


// To run this script, execute `npm run build:json` in your terminal.
buildIndianCollegesJson();

