'use server';
/**
 * @fileOverview Recommends degree courses after class 12 based on stream, aptitude, and career goals.
 *
 * - recommendDegreeCourses - A function that recommends degree courses.
 * - DegreeCourseRecommendationInput - The input type for the recommendDegreeCourses function.
 * - DegreeCourseRecommendationOutput - The return type for the recommendDegreeCourses function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {gemini15Flash} from '@genkit-ai/googleai';

const DegreeCourseRecommendationInputSchema = z.object({
  stream: z
    .string()
    .describe('The student\'s chosen stream after class 12 (e.g., Science, Arts, Commerce).'),
  aptitude: z
    .string()
    .describe(
      'Aptitude and academic performance of the student, including grades and areas of strength.'
    ),
  careerGoals: z
    .string()
    .describe(
      'The student\'s career goals and aspirations. Include specific fields or industries of interest.'
    ),
});
export type DegreeCourseRecommendationInput = z.infer<
  typeof DegreeCourseRecommendationInputSchema
>;

const DegreeCourseRecommendationOutputSchema = z.object({
  recommendedCourses: z
    .array(z.string())
    .describe('A list of recommended degree courses based on the input.'),
  rationale: z
    .string()
    .describe(
      'Detailed rationales for each recommended course, incorporating information from past successful student paths.'
    ),
});
export type DegreeCourseRecommendationOutput = z.infer<
  typeof DegreeCourseRecommendationOutputSchema
>;

export async function recommendDegreeCourses(
  input: DegreeCourseRecommendationInput
): Promise<DegreeCourseRecommendationOutput> {
  return recommendDegreeCoursesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'degreeCourseRecommendationPrompt',
  model: gemini15Flash,
  input: {schema: DegreeCourseRecommendationInputSchema},
  output: {schema: DegreeCourseRecommendationOutputSchema},
  prompt: `You are an expert academic advisor. Recommend suitable degree courses after class 12 based on the following information:

  Stream: {{{stream}}}
  Aptitude and Academic Performance: {{{aptitude}}}
  Career Goals: {{{careerGoals}}}

  Provide a list of recommended courses and detailed rationales for each, incorporating information from past successful student paths. Focus on degree courses and not specific colleges.

  Your output should be in JSON format.
  `,
});

const recommendDegreeCoursesFlow = ai.defineFlow(
  {
    name: 'recommendDegreeCoursesFlow',
    inputSchema: DegreeCourseRecommendationInputSchema,
    outputSchema: DegreeCourseRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
