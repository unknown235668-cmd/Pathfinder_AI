'use server';
/**
 * @fileOverview Suggests a stream (Science, Arts, Commerce, etc.) after class 10 based on student interests and academic performance.
 *
 * - suggestStream - A function that handles the stream suggestion process.
 * - SuggestStreamInput - The input type for the suggestStream function.
 * - SuggestStreamOutput - The return type for the suggestStream function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestStreamInputSchema = z.object({
  interests: z
    .string()
    .describe('The student\'s interests, such as science, arts, or business.'),
  academicPerformance: z
    .string()
    .describe(
      'The student\'s academic performance in class 10, including grades in relevant subjects.'
    ),
});
export type SuggestStreamInput = z.infer<typeof SuggestStreamInputSchema>;

const SuggestStreamOutputSchema = z.object({
  suggestedStream: z
    .string()
    .describe(
      'The suggested stream for the student (Science, Arts, Commerce, etc.).'
    ),
  reasoning: z
    .string()
    .describe(
      'The reasoning behind the stream suggestion, based on the student\'s interests and academic performance.'
    ),
});
export type SuggestStreamOutput = z.infer<typeof SuggestStreamOutputSchema>;

export async function suggestStream(input: SuggestStreamInput): Promise<SuggestStreamOutput> {
  return suggestStreamFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestStreamPrompt',
  input: {schema: SuggestStreamInputSchema},
  output: {schema: SuggestStreamOutputSchema},
  prompt: `You are an academic advisor suggesting a stream to a student after class 10.

  Based on the student's interests and academic performance, suggest the most suitable stream (Science, Arts, Commerce, etc.). Explain your reasoning.

  Interests: {{{interests}}}
  Academic Performance: {{{academicPerformance}}}
  \nSuggested Stream:`,
});

const suggestStreamFlow = ai.defineFlow(
  {
    name: 'suggestStreamFlow',
    inputSchema: SuggestStreamInputSchema,
    outputSchema: SuggestStreamOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
