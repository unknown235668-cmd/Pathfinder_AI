'use server';

/**
 * @fileOverview A career path exploration AI agent.
 *
 * - careerPathExploration - A function that handles the career path exploration process.
 * - CareerPathExplorationInput - The input type for the careerPathExploration function.
 * - CareerPathExplorationOutput - The return type for the careerPathExploration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {gemini15Flash} from '@genkit-ai/googleai';

const CareerPathExplorationInputSchema = z.object({
  degreeCourse: z.string().describe('The degree course chosen by the student.'),
});
export type CareerPathExplorationInput = z.infer<typeof CareerPathExplorationInputSchema>;

const CareerPathExplorationOutputSchema = z.object({
  careerPaths: z
    .array(z.string())
    .describe('An array of potential career paths related to the degree course.'),
  requiredSkills: z
    .array(z.string())
    .describe('An array of required skills for the potential career paths.'),
  jobMarketTrends: z.string().describe('The job market trends for the potential career paths.'),
});
export type CareerPathExplorationOutput = z.infer<typeof CareerPathExplorationOutputSchema>;

export async function careerPathExploration(
  input: CareerPathExplorationInput
): Promise<CareerPathExplorationOutput> {
  return careerPathExplorationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'careerPathExplorationPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: CareerPathExplorationInputSchema},
  output: {schema: CareerPathExplorationOutputSchema},
  prompt: `You are an expert career counselor.

You will provide potential career paths, required skills, and job market trends related to the chosen degree course.

Degree Course: {{{degreeCourse}}}`,
});

const careerPathExplorationFlow = ai.defineFlow(
  {
    name: 'careerPathExplorationFlow',
    inputSchema: CareerPathExplorationInputSchema,
    outputSchema: CareerPathExplorationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
