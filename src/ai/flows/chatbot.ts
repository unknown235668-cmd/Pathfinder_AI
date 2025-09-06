
'use server';

/**
 * @fileOverview A general-purpose chatbot flow.
 *
 * - freeformChat - A function that handles freeform chat queries.
 * - ChatInput - The input type for the freeformChat function.
 * - ChatOutput - The return type for the freeformChat function.
 */

import { definePromptWithFallback } from '@/ai/genkit';
import {
    ChatInput,
    ChatOutput,
    ChatInputSchema,
    ChatOutputSchema
} from './types';


export async function freeformChat(
  input: ChatInput
): Promise<ChatOutput> {
  const {output} = await definePromptWithFallback(
    {
      name: 'freeformChatPrompt',
      input: {schema: ChatInputSchema},
      output: {schema: ChatOutputSchema},
      prompt: `You are a helpful AI assistant named Pathfinder AI. You can answer questions, provide explanations, and have a conversation on a wide variety of topics. Be friendly, helpful, and concise.

User's query: {{{query}}}`,
    },
    input
  );
  return output!;
}
