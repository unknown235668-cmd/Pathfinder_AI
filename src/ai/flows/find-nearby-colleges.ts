
'use server';

/**
 * @fileOverview Finds nearby colleges using AI based on a location string.
 *
 * - findNearbyColleges - A function that returns a list of colleges.
 * - FindNearbyCollegesInput - The input type for the findNearbyColleges function.
 * - FindNearbyCollegesOutput - The return type for the findNearbyColleges function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FindNearbyCollegesInputSchema = z.object({
  location: z.string().describe('A city or region name provided by the user.')
});
export type FindNearbyCollegesInput = z.infer<typeof FindNearbyCollegesInputSchema>;

const FindNearbyCollegesOutputSchema = z.object({
  colleges: z.array(z.object({
    name: z.string().describe("The full name of the college."),
    location: z.string().describe("The city or specific address of the college."),
  })).describe("An array of 10 to 15 plausible-sounding government colleges near the given coordinates or in the specified location. Make the names and locations sound as realistic as possible for the region.")
});
export type FindNearbyCollegesOutput = z.infer<typeof FindNearbyCollegesOutputSchema>;

export async function findNearbyColleges(
  input: FindNearbyCollegesInput
): Promise<FindNearbyCollegesOutput> {
  return findNearbyCollegesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findNearbyCollegesPrompt',
  input: {schema: FindNearbyCollegesInputSchema},
  output: {schema: FindNearbyCollegesOutputSchema},
  prompt: `You are a helpful assistant. Based on the provided location information, generate a list of 10 to 15 plausible-sounding government colleges in that area. Make the names and locations sound as realistic as possible for the region.

Location: {{{location}}}
`,
});

const findNearbyCollegesFlow = ai.defineFlow(
  {
    name: 'findNearbyCollegesFlow',
    inputSchema: FindNearbyCollegesInputSchema,
    outputSchema: FindNearbyCollegesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
