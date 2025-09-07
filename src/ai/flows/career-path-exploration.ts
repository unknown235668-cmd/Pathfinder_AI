/**
 * Copyright 2025 Pathfinder AI Contributors
 *
 * Licensed under the Apache 2.0 License.
 * See LICENSE-APACHE for details.
 */

'use server';

/**
 * @fileOverview A career path exploration AI agent.
 *
 * - careerPathExploration - A function that handles the career path exploration process.
 * - CareerPathExplorationInput - The input type for the careerPathExploration function.
 * - CareerPathExplorationOutput - The return type for the careerPathExploration function.
 */

import {definePromptWithFallback} from '@/ai/genkit';
import {
  CareerPathExplorationInput,
  CareerPathExplorationOutput,
  CareerPathExplorationInputSchema,
  CareerPathExplorationOutputSchema
} from './types';


export async function careerPathExploration(
  input: CareerPathExplorationInput
): Promise<CareerPathExplorationOutput> {
  const {output} = await definePromptWithFallback(
    {
      name: 'careerPathExplorationPrompt',
      input: {schema: CareerPathExplorationInputSchema},
      output: {schema: CareerPathExplorationOutputSchema},
      prompt: `You are an expert career counselor.

You will provide potential career paths, required skills, and job market trends related to the chosen degree course.

Degree Course: {{{degreeCourse}}}`,
    },
    input
  );
  return output!;
}
