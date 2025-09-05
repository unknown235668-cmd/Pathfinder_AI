'use server';

/**
 * @fileOverview Finds nearby government or private colleges by querying a master data file.
 * This flow does not use a generative AI model for data retrieval to ensure accuracy and performance.
 * It filters a comprehensive JSON file containing a list of all institutions in India.
 *
 * - findNearbyColleges - A function that returns a list of colleges based on filters.
 * - FindNearbyCollegesInput - The input type for the findNearbyColleges function.
 * - FindNearbyCollegesOutput - The return type for the findNearbyColleges function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
// Import the master data file. This acts as our local database.
import collegesMaster from '@/data/collegesMaster.json';

// Define the structure for a single college, which aligns with the JSON data.
const CollegeSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.enum(["college", "university", "institute"]),
  ownership: z.enum(["government", "private"]),
  category: z.string(),
  state: z.string(),
  city: z.string(),
  address: z.string(),
  website: z.string().optional(),
  approval_body: z.string(),
  aliases: z.array(z.string()).optional(),
});

// Input Schema: Defines the filters the frontend can send.
// The 'city' field now acts as a universal search query for city, state, or name.
const FindNearbyCollegesInputSchema = z.object({
  state: z.string().optional().describe('An Indian state to filter by.'),
  city: z.string().optional().describe('A universal search query for city, state, or institution name/alias.'),
  category: z.string().optional().describe('An optional category to filter colleges (e.g., engineering, medical).'),
  typeFilter: z.string().optional().describe('The type of institution to filter by: "government" or "private".')
});
export type FindNearbyCollegesInput = z.infer<typeof FindNearbyCollegesInputSchema>;

// Output Schema: Defines the structure of the flow's response.
const FindNearbyCollegesOutputSchema = z.object({
  colleges: z.array(CollegeSchema).describe("An array of institutions matching the filter criteria.")
});
export type FindNearbyCollegesOutput = z.infer<typeof FindNearbyCollegesOutputSchema>;

// This is the main function the frontend will call.
export async function findNearbyColleges(
  input: FindNearbyCollegesInput
): Promise<FindNearbyCollegesOutput> {
  return findNearbyCollegesFlow(input);
}


// AI Flow: This function orchestrates the data filtering.
// It queries the master JSON data instead of calling a generative AI model.
const findNearbyCollegesFlow = ai.defineFlow(
  {
    name: 'findNearbyCollegesFlow',
    inputSchema: FindNearbyCollegesInputSchema,
    outputSchema: FindNearbyCollegesOutputSchema,
  },
  async (input) => {
    // Start with the full list of colleges from the master data file.
    let filteredColleges = collegesMaster;

    // Apply the 'ownership' filter (government or private).
    if (input.typeFilter) {
      filteredColleges = filteredColleges.filter(
        college => college.ownership.toLowerCase() === input.typeFilter?.toLowerCase()
      );
    }

    // Apply the 'state' filter if provided.
    if (input.state) {
      filteredColleges = filteredColleges.filter(
        college => college.state.toLowerCase() === input.state?.toLowerCase()
      );
    }
    
    // Apply the universal search query if provided.
    // This searches for matches in the institution's name, city, or state.
    if (input.city) {
      const searchQuery = input.city.toLowerCase();
      filteredColleges = filteredColleges.filter(college => 
        college.name.toLowerCase().includes(searchQuery) ||
        college.city.toLowerCase().includes(searchQuery) ||
        college.state.toLowerCase().includes(searchQuery) ||
        college.aliases?.some(alias => alias.toLowerCase().includes(searchQuery))
      );
    }

    // Apply the 'category' filter if provided.
    if (input.category) {
        filteredColleges = filteredColleges.filter(
          college => college.category.toLowerCase() === input.category?.toLowerCase()
        );
    }
    
    // Return the filtered list wrapped in the expected output structure.
    // This method guarantees that all matching colleges are returned without truncation.
    return { colleges: filteredColleges as any };
  }
);
