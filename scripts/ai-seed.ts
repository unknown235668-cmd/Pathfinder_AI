
import { config } from 'dotenv';
config(); // Load environment variables from .env

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { gemini15Flash } from '@genkit-ai/googleai';
import { firestore } from '@/lib/firebase-admin';

// ------------------ Schemas ------------------

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

const ScrapeInputSchema = z.object({
    state: z.string().optional(),
    ownership: z.string().optional(),
    category: z.string().optional(),
});

const ScrapeOutputSchema = z.object({
  colleges: z.array(CollegeSchema),
});


// ------------------ AI Flow: Scrape + Enrich ------------------

const scrapeAndEnrichPrompt = ai.definePrompt({
  name: 'scrapeAndEnrichPrompt',
  model: gemini15Flash,
  input: { schema: ScrapeInputSchema },
  output: { schema: ScrapeOutputSchema },
  prompt: `
You are an AI web-scraper + data enricher.
Scrape reliable sources (AICTE, UGC, NIRF, Wikipedia, official college sites)
for Indian colleges/universities that match filters:

- State: {{{state}}}
- Ownership: {{{ownership}}}
- Category: {{{category}}}

Return structured JSON ONLY:
- id (unique number, generate if missing)
- name
- type (college/university/institute)
- ownership (government/private)
- category
- state
- city
- address
- website
- approval_body
- aliases (array of strings)

No free text. Only JSON.
`
});

// ------------------ Firestore Save ------------------

async function saveToFirestore(colleges: z.infer<typeof ScrapeOutputSchema>["colleges"]) {
  if (!colleges || colleges.length === 0) return;
  const batch = firestore.batch();
  colleges.forEach((college) => {
    const ref = firestore.collection('collegesMaster').doc(college.id.toString());
    batch.set(ref, college, { merge: true });
  });
  await batch.commit();
}

// ------------------ Main Autonomous Seeder ------------------

const states = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"
];

const categories = [
  "Engineering","Medical","Management","Law","Arts","Science","Commerce","Pharmacy",
  "Agriculture","Fashion","Architecture","Polytechnic"
];

const ownerships = ["government", "private"];

export async function autoSeedColleges() {
  let totalSaved = 0;

  for (const state of states) {
    for (const category of categories) {
      for (const ownership of ownerships) {
        try {
          console.log(`🌐 Scraping: ${state} | ${ownership} | ${category}`);
          const { output } = await scrapeAndEnrichPrompt({ state, ownership, category });
          
          if (!output || !output.colleges || output.colleges.length === 0) {
              console.log(`- No data returned for ${state}-${ownership}-${category}. Skipping.`);
              continue;
          }

          await saveToFirestore(output.colleges);
          totalSaved += output.colleges.length;
          console.log(`✅ Saved ${output.colleges.length} colleges for ${state}-${ownership}-${category}. Total saved: ${totalSaved}`);
        
        } catch (err) {
          console.error(`❌ Failed for ${state}-${ownership}-${category}`, err);
        }
      }
    }
  }

  console.log(`\n🎉 Autonomous seeding complete. Total colleges saved: ${totalSaved}`);
  return { success: true, totalSaved };
}


// To run this seeder, execute `npm run db:ai-seed` in your terminal.
autoSeedColleges();
