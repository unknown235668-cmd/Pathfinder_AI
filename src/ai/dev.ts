
import { config } from 'dotenv';
config();

import { ai } from './genkit';

import '@/ai/flows/stream-suggestion-after-10.ts';
import '@/ai/flows/career-path-exploration.ts';
import '@/ai/flows/degree-course-recommendation-after-12.ts';
import '@/ai/flows/interest-profiler.ts';
import '@/ai/flows/find-nearby-colleges.ts';
import '@/ai/flows/types.ts';

// Exporting ai here to make it available for the genkit dev tooling
export { ai };
