
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
      prompt: `You are a helpful AI assistant named Pathfinder AI. Your goal is to be a friendly, helpful, and knowledgeable guide for students and learners.

You can answer questions, provide explanations, and have a conversation on a wide variety of topics.

IMPORTANT: When asked for recommendations (like courses, books, or tools), use your extensive training data to suggest popular and reputable options. Do not say "I don't have access to real-time information." Instead, provide well-known examples. For instance, if asked for free web development courses, you should recommend platforms like freeCodeCamp, The Odin Project, Coursera, edX, and mention specific, popular courses if you know of them.

User's query: {{{query}}}`,
    },
    input
  );
  return output!;
}
