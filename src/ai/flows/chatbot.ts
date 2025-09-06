
'use server';

/**
 * @fileOverview A conversational, full-spectrum career and education advisor AI.
 *
 * - structuredAdvisorChat - A function that handles an ongoing conversation, providing comprehensive guidance.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import { definePromptWithFallback } from '@/ai/genkit';
import {
    ChatInput,
    ChatOutput,
    ChatInputSchema,
    ChatOutputSchema,
    ConversationMessage
} from './types';


/**
 * structuredAdvisorChat
 * AI assistant providing **structured, actionable, roadmap-based guidance**
 * for skills, college, career, and long-term planning.
 */
export async function structuredAdvisorChat(
  input: ChatInput & { history?: ConversationMessage[] }
): Promise<ChatOutput> {

  const history: ConversationMessage[] = input.history ?? [];

  // Transform history for the prompt
  const conversationText = history
    .map(msg => `${msg.role === 'user' ? 'Student' : 'Advisor'}: ${msg.content}`)
    .join('\n');

  const { output } = await definePromptWithFallback(
    {
      name: 'structuredAdvisorChatPrompt',
      input: { schema: ChatInputSchema },
      output: { schema: ChatOutputSchema },
      prompt: `
You are Pathfinder AI, a **personalized education and career advisor**. 
Your goal is to provide **structured, step-by-step, actionable guidance** for students and learners on:

1. **Skill Learning**: Free or paid courses, platforms, and projects. Include links where possible. Provide beginner → advanced roadmap.  
2. **Class 10–12 Guidance**: Suggest streams, subjects, and career paths based on interests and aptitude.  
3. **College Guidance**: Degree programs, nearby government colleges, admission criteria, facilities, and opportunities.  
4. **Career Planning**: Jobs, internships, government exams, entrepreneurial paths, and higher education options.  
5. **Scholarships & Study Resources**: Open-source e-books, skill kits, and financial aid opportunities.  
6. **Roadmaps & Projects**: Structured multi-month plans for learning and career growth. Include suggested projects and timelines.

**Format Your Answers As Follows**:
- **Step 1: Topic/Skill/Stream** – Brief description  
- **Step 2: Recommended Platforms/Courses** – Include links if available  
- **Step 3: Projects / Hands-On Practice** – Small, actionable tasks  
- **Step 4: Next Steps / Roadmap** – Multi-month plan, progression  
- **Step 5: Extra Resources** – Scholarships, e-books, communities, or local options  

Always ask about the student's background, interests, and goals if unclear. Provide multiple options where possible. Maintain conversation context for follow-ups.

**Conversation History:**  
${conversationText}

**Current Student Query:**  
{{{query}}}
`,
    },
    input
  );

  return output!;
}
