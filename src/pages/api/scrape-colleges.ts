import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { firestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// --- Types ---
interface CollegeData {
  name: string;
  city: string;
  state: string;
  category: string;
  ownership: 'Government' | 'Private' | 'Unknown';
  website?: string;
  [key: string]: any; // Allow other fields
}

interface ScrapeSummary {
  totalScraped: number;
  totalInserted: number;
  totalSkipped: number;
  errors: string[];
}

// --- Constants ---
const BASE_URL = 'https://collegedunia.com';
const COLLEGES_PER_PAGE = 20; // This can be adjusted if the site changes its layout
const MAX_PAGES_TO_SCRAPE = 5; // To prevent excessively long runs, can be changed or removed
const RATE_LIMIT_DELAY_MS = 1000; // 1 second delay between requests

// --- Helper Functions ---

/**
 * Delays execution for a specified amount of time.
 * @param ms - The number of milliseconds to wait.
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetches the HTML content of a given URL with retries.
 * @param url - The URL to fetch.
 * @param retries - The number of retries to attempt.
 * @returns The HTML content as a string or null if all retries fail.
 */
async function fetchPage(url: string, retries = 3): Promise<string | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      return data;
    } catch (error: any) {
      console.error(`Attempt ${i + 1} failed for ${url}: ${error.message}`);
      if (i === retries - 1) {
        console.error(`All retries failed for ${url}.`);
        return null;
      }
      await sleep(RATE_LIMIT_DELAY_MS * (i + 1)); // Exponential backoff
    }
  }
  return null;
}

/**
 * Parses the HTML of a Collegedunia page to extract college data.
 * @param html - The HTML content of the page.
 * @returns An array of college data objects.
 */
function parseColleges(html: string): CollegeData[] {
  const $ = cheerio.load(html);
  const colleges: CollegeData[] = [];

  $('div.clg-tpl-parent-card').each((_i, el) => {
    const name = $(el).find('h3.college_name').text().trim();
    const location = $(el).find('span[itemprop="addressLocality"]').text().trim();
    const [city, state] = location.split(',').map(s => s.trim());
    const website = $(el).find('a[data-csm-title="Official Website"]').attr('href');

    // Extracting details from the tags below the college name
    const details: { [key: string]: string } = {};
    $(el).find('.clg-slice-parent .jsx-203994800').each((_j, detailEl) => {
      const text = $(detailEl).text().trim();
      if (text.toLowerCase().includes('approved by')) {
        details.approval = text;
      } else if (text.toLowerCase().includes('private') || text.toLowerCase().includes('public')) {
        details.ownership = text.toLowerCase().includes('private') ? 'Private' : 'Government';
      } else {
        // This is a common pattern for category, e.g., "BE/B.Tech", "MBBS"
        if(!details.category) details.category = text;
      }
    });

    if (name && city && state) {
      colleges.push({
        name,
        city,
        state,
        website: website || undefined,
        category: details.category || 'Unknown',
        ownership: (details.ownership as CollegeData['ownership']) || 'Unknown',
      });
    }
  });

  return colleges;
}

/**
 * Saves an array of college data to Firestore, skipping duplicates.
 * @param colleges - An array of college data objects.
 * @returns A summary of the database operation.
 */
async function saveColleges(colleges: CollegeData[]): Promise<Omit<ScrapeSummary, 'totalScraped' | 'errors'>> {
  const collectionRef = firestore.collection('scraped-colleges');
  let inserted = 0;
  let skipped = 0;

  const promises = colleges.map(async (college) => {
    const uniqueId = `${college.name.toLowerCase().replace(/\s+/g, '-')}-${college.city.toLowerCase()}`;
    const docRef = collectionRef.doc(uniqueId);

    const docSnap = await docRef.get();

    if (docSnap.exists) {
      skipped++;
    } else {
      await docRef.set({
        ...college,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      inserted++;
    }
  });

  await Promise.all(promises);
  return { totalInserted: inserted, totalSkipped: skipped };
}

// --- API Handler ---

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  console.log('🚀 Starting college scraping process...');
  const summary: ScrapeSummary = {
    totalScraped: 0,
    totalInserted: 0,
    totalSkipped: 0,
    errors: [],
  };

  try {
    for (let pageNum = 1; pageNum <= MAX_PAGES_TO_SCRAPE; pageNum++) {
      console.log(`- Scraping page ${pageNum}...`);
      const url = `${BASE_URL}/colleges?page=${pageNum}`;
      const html = await fetchPage(url);

      if (!html) {
        const errorMsg = `Failed to fetch page ${pageNum}. Stopping process.`;
        console.error(errorMsg);
        summary.errors.push(errorMsg);
        break; 
      }

      const collegesOnPage = parseColleges(html);
      if (collegesOnPage.length === 0) {
        console.log(`No colleges found on page ${pageNum}. Assuming end of list.`);
        break;
      }
      
      summary.totalScraped += collegesOnPage.length;

      const dbResult = await saveColleges(collegesOnPage);
      summary.totalInserted += dbResult.totalInserted;
      summary.totalSkipped += dbResult.totalSkipped;

      console.log(`  - Scraped: ${collegesOnPage.length}, Inserted: ${dbResult.totalInserted}, Skipped: ${dbResult.totalSkipped}`);

      await sleep(RATE_LIMIT_DELAY_MS);
    }

    console.log('✅ Scraping process completed.');
    res.status(200).json(summary);

  } catch (error: any) {
    console.error('❌ An unexpected error occurred during the scraping process:', error);
    summary.errors.push(error.message || 'An unknown error occurred.');
    res.status(500).json({ error: 'Internal Server Error', details: summary });
  }
}
