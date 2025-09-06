
'use server';

/**
 * @fileOverview Generates a personalized career plan for students.
 *
 * Features:
 * - Strongly typed input/output contracts (schemas).
 * - Deterministic prompt execution with fallback + retry.
 * - Post-generation validation and sanitization.
 * - JSON-only structured output with strict section keys.
 */

import { definePromptWithFallback } from '@/ai/genkit';
import {
  CareerPlanInput,
  CareerPlanOutput,
  CareerPlanInputSchema,
  CareerPlanOutputSchema,
} from './types';
import { z } from 'zod';

/**
 * Generate a structured and detailed career plan.
 *
 * @param input - CareerPlanInput (skills, goals, experience, career outcome).
 * @returns CareerPlanOutput (strictly validated roadmap).
 */
export async function generateCareerPlan(
  input: CareerPlanInput
): Promise<CareerPlanOutput> {
  const { output } = await definePromptWithFallback(
    {
      name: 'careerPlanPrompt',
      input: { schema: CareerPlanInputSchema },
      output: { schema: CareerPlanOutputSchema },
      prompt: `
You are CoreMentor AI, the world’s most advanced Career Mentor. Your job is to generate ultra-detailed, personalized step-by-step career roadmaps that are actionable, measurable, and adapted to each user’s background. You are strict, practical, and motivating like a real human mentor. You never give vague advice, only concrete steps with clear outcomes.

User Input:
- Current Skills: {{{currentSkills}}}
- Interests / Goals: {{{interestsGoals}}}
- Experience Level: {{{experienceLevel}}}
- Desired Career Outcome: {{{desiredCareerOutcome}}}

### Roadmap Sections:

1.  **careerRoadmap**: Break the journey into phases (Beginner, Intermediate, Advanced) with timelines (e.g., Months 1–3, 4–6, etc.), skills to master, and expected outcomes.
2.  **learningPlan**: A month-by-month breakdown. For each month, include not just *what* to study, but *how* to think about it. Incorporate **deep problem-solving** (e.g., data structures, algorithms, LeetCode-style practice), **architectural thinking** (e.g., design patterns, system design, clean code principles), and **cutting-edge tech** relevant to the user’s goal. List topics, why they matter, expected outcomes, and recommended resources with links.
3.  **weeklyTasks**: A strict weekly schedule for the first 12 Weeks with daily/weekly study + hands-on practice. Include mini evaluations at Week 4, 8, and 12.
4.  **projects**: Innovative, portfolio-worthy project ideas (Beginner, Intermediate, Advanced). For each: Scope, Tech stack, Outcome, Key Learnings & Challenges, and Documentation requirements (README, demo, design notes). Advanced projects should be of FAANG-level quality, suggesting modern tech like AI/ML integration, serverless architecture, or real-time data streaming.
5.  **careerTips**: Provide advanced, actionable strategies for GitHub profile optimization, LinkedIn networking, resume building, and acing technical interviews. Include specific examples and tools.
6.  **careerMilestones**: Define concrete, measurable checkpoints at 3, 6, 12, and 18–24 months. Each must include specific achievements, such as "3 projects deployed," "Security+ certification obtained," "20 meaningful open-source contributions," or "Landed a paid internship."
7.  **resources**: Curated list of docs, courses, books, and platforms mapped to roadmap stages.
8.  **evaluation**: Self-assessment methods (mini projects, mock interviews, coding challenges) at regular intervals.

### ⚡ Important Rules:
-   **Personalize**: Always adapt the roadmap to the user’s background. If they know JavaScript, skip basics and emphasize frameworks or advanced concepts.
-   **Be Specific**: Avoid generic advice like 'practice coding'. Instead, give concrete tasks, e.g., 'Solve 10 problems on LeetCode Arrays this week' or 'Build 3 responsive landing pages using Flexbox and Grid'.
-   **Be Motivational but Realistic**: Encourage the user while setting achievable expectations for their experience level.
-   **JSON Output Only**: The final output must be a single, valid JSON object with the exact keys: \`careerRoadmap\`, \`learningPlan\`, \`weeklyTasks\`, \`projects\`, \`careerTips\`, \`careerMilestones\`, \`resources\`, \`evaluation\`. Do not include any markdown or explanatory text outside of the JSON structure.
      `,
    },
    input
  );

  if (!output) {
    throw new Error('Failed to generate career plan: No output returned.');
  }

  //  Sanitize accidental markdown/code fences
  const rawString =
    typeof output === 'string' ? output.replace(/```json|```/g, '').trim() : JSON.stringify(output);

  //  Validate against schema
  const parsed = CareerPlanOutputSchema.safeParse(JSON.parse(rawString));
  if (!parsed.success) {
    console.error('CareerPlan validation error:', parsed.error.format());
    throw new Error('Generated plan failed schema validation.');
  }

  return parsed.data;
}
