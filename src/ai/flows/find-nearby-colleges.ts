
'use server';

/**
 * @fileOverview Finds nearby colleges using AI based on latitude and longitude.
 *
 * - findNearbyColleges - A function that returns a list of colleges.
 * - FindNearbyCollegesInput - The input type for the findNearbyColleges function.
 * - FindNearbyCollegesOutput - The return type for the findNearbyColleges function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FindNearbyCollegesInputSchema = z.object({
  latitude: z.number().describe('The latitude of the user.'),
  longitude: z.number().describe('The longitude of the user.'),
});
export type FindNearbyCollegesInput = z.infer<typeof FindNearbyCollegesInputSchema>;

const FindNearbyCollegesOutputSchema = z.object({
  colleges: z.array(z.object({
    name: z.string().describe("The full name of the college."),
    location: z.string().describe("The city or specific address of the college."),
  })).describe("An array of plausible government colleges near the given coordinates. Generate at least 4.")
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
  prompt: `You are a helpful assistant. Based on the provided latitude and longitude, identify the city or region and generate a list of 4 to 5 plausible-sounding government colleges in that area.

Latitude: {{{latitude}}}
Longitude: {{{longitude}}}`,
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
