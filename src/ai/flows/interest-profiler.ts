'use server';

/**
 * @fileOverview Interest Profiler AI agent.
 *
 * - interestProfiler - A function that handles the interest profiling process.
 * - InterestProfilerInput - The input type for the interestProfiler function.
 * - InterestProfilerOutput - The return type for the interestProfiler function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InterestProfilerInputSchema = z.object({
  interests: z
    .string()
    .describe(
      'A list of student interests, separated by commas, e.g., science, art, sports.'
    ),
  academicPerformance: z
    .string()
    .describe(
      'A description of the students academic performance, including grades in different subjects.'
    ),
  careerGoals: z
    .string()
    .describe('A description of the students career goals.'),
});
export type InterestProfilerInput = z.infer<typeof InterestProfilerInputSchema>;

const InterestProfilerOutputSchema = z.object({
  streamSuggestion: z
    .string()
    .describe(
      'The suggested stream (Science, Arts, Commerce, etc.) based on the student interests, academic performance, and career goals.'
    ),
  courseSuggestion: z
    .string()
    .describe(
      'The suggested degree course based on the chosen stream, student aptitude, and career goals.'
    ),
  rationale: z
    .string()
    .describe(
      'A detailed rationale for the stream and course suggestions, incorporating information from past successful student paths.'
    ),
});
export type InterestProfilerOutput = z.infer<typeof InterestProfilerOutputSchema>;

export async function interestProfiler(input: InterestProfilerInput): Promise<InterestProfilerOutput> {
  return interestProfilerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'interestProfilerPrompt',
  input: {schema: InterestProfilerInputSchema},
  output: {schema: InterestProfilerOutputSchema},
  prompt: `You are an expert academic advisor specializing in providing personalized recommendations to students after class 10/12.

Based on the student's interests, academic performance, and career goals, you will suggest a suitable stream (Science, Arts, Commerce, etc.) after class 10, and a suitable degree course after class 12.

You will provide a detailed rationale for your suggestions, incorporating information from past successful student paths.

Interests: {{{interests}}}
Academic Performance: {{{academicPerformance}}}
Career Goals: {{{careerGoals}}}`,
});

const interestProfilerFlow = ai.defineFlow(
  {
    name: 'interestProfilerFlow',
    inputSchema: InterestProfilerInputSchema,
    outputSchema: InterestProfilerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
