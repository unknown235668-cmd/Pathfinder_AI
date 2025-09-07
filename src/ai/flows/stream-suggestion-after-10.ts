/**
 * Copyright 2025 Pathfinder AI Contributors
 *
 * Licensed under the MIT License or Apache 2.0 License.
 * See LICENSE-MIT or LICENSE-APACHE for details.
 */

'use server';
/**
 * @fileOverview Suggests a stream (Science, Arts, Commerce, etc.) after class 10 based on student interests and academic performance.
 *
 * - suggestStream - A function that handles the stream suggestion process.
 * - SuggestStreamInput - The input type for the suggestStream function.
 * - SuggestStreamOutput - The return type for the suggestStream function.
 */

import {definePromptWithFallback} from '@/ai/genkit';
import {
    SuggestStreamInput,
    SuggestStreamOutput,
    SuggestStreamInputSchema,
    SuggestStreamOutputSchema
} from './types';

export async function suggestStream(input: SuggestStreamInput): Promise<SuggestStreamOutput> {
  const {output} = await definePromptWithFallback(
    {
      name: 'suggestStreamPrompt',
      input: {schema: SuggestStreamInputSchema},
      output: {schema: SuggestStreamOutputSchema},
      prompt: `You are an academic advisor suggesting a stream to a student after class 10.

  Based on the student's interests and academic performance, suggest the most suitable stream (Science, Arts, Commerce, etc.). Explain your reasoning.

  Interests: {{{interests}}}
  Academic Performance: {{{academicPerformance}}}
  \nSuggested Stream:`,
    },
    input
  );
  return output!;
}

    