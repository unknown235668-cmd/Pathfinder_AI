
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
2.  **learningPlan**: A month-by-month breakdown of topics. For each month: include what to study, why it matters, expected outcomes, and recommended resources (free + premium, if relevant) with links.
3.  **weeklyTasks**: A strict weekly schedule for the first 12 Weeks with daily/weekly study + hands-on practice. Include mini evaluations at Week 4, 8, and 12.
4.  **projects**: Beginner, Intermediate, and Advanced project ideas. For each: Scope, Tech stack, Outcome, Documentation requirements (README, demo, design notes).
5.  **careerTips**: Advanced strategies for GitHub, LinkedIn, resumes, networking, interview prep, open-source contributions, and daily coding habits.
6.  **careerMilestones**: Checkpoints at 3, 6, 12, and 18–24 months. Each must include measurable achievements (X projects, Y interviews, Z certifications, job secured).
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
