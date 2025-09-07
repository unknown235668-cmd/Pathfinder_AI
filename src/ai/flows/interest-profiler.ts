/**
 * Copyright 2025 Pathfinder AI Contributors
 *
 * Licensed under the MIT License or Apache 2.0 License.
 * See LICENSE-MIT or LICENSE-APACHE for details.
 */

'use server';

/**
 * @fileOverview Interest Profiler AI agent.
 *
 * - interestProfiler - A function that handles the interest profiling process.
 * - InterestProfilerInput - The input type for the interestProfiler function.
 * - InterestProfilerOutput - The return type for the interestProfiler function.
 */

import {definePromptWithFallback} from '@/ai/genkit';
import {
    InterestProfilerInput,
    InterestProfilerOutput,
    InterestProfilerInputSchema,
    InterestProfilerOutputSchema
} from './types';

export async function interestProfiler(input: InterestProfilerInput): Promise<InterestProfilerOutput> {
  const {output} = await definePromptWithFallback(
    {
      name: 'interestProfilerPrompt',
      input: {schema: InterestProfilerInputSchema},
      output: {schema: InterestProfilerOutputSchema},
      prompt: `You are an expert academic advisor specializing in providing personalized recommendations to students after class 10/12.

Based on the student's interests, academic performance, and career goals, you will suggest a suitable stream (Science, Arts, Commerce, etc.) after class 10, and a suitable degree course after class 12.

You will provide a detailed rationale for your suggestions, incorporating information from past successful student paths.

Interests: {{{interests}}}
Academic Performance: {{{academicPerformance}}}
Career Goals: {{{careerGoals}}}`,
    },
    input
  );
  return output!;
}

    
