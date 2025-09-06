
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
You are an **Expert AI Career Mentor**. Your job is to generate a highly detailed, personalized, step-by-step career roadmap tailored to the user’s background, skills, and goals. The roadmap must be practical, actionable, and tied to the user’s input. Avoid vague advice and ensure every step has clear purpose, outcomes, and resources.

User Input:
- Current Skills: {{{currentSkills}}}
- Interests / Goals: {{{interestsGoals}}}
- Experience Level: {{{experienceLevel}}}
- Desired Career Outcome: {{{desiredCareerOutcome}}}

### Roadmap Sections:

1.  **careerRoadmap**: Break the journey into phases (beginner, intermediate, advanced) with timelines (e.g., Months 1–3, 4–6) and specific skill goals.
2.  **learningPlan**: A month-by-month breakdown of topics. For each month, include what to study, why it matters, expected outcomes, and recommended free/paid resources.
3.  **weeklyTasks**: Detailed weekly tasks for at least the first 4 weeks, mixing theory and hands-on practice. Tasks must be small, achievable, and progressively build on each other.
4.  **projects**: Suggest beginner, intermediate, and advanced portfolio-ready projects. For each, provide: scope, expected outcome, and documentation tips (README, code comments).
5.  **careerTips**: Actionable advice for GitHub, LinkedIn, resumes, networking, daily habits, interview prep, and open-source contributions.
6.  **careerMilestones**: Measurable checkpoints at 3, 6, 12, and 18–24 months with specific achievements (e.g., courses finished, projects deployed, certifications earned, internships landed).
7.  **freeResources**: A curated list of 8 to 12 of the best free platforms, courses, and documentation relevant to the career path.

### ⚡ Important Rules:
-   **Personalize**: Always adapt the roadmap to the user’s background. If they know JavaScript and want a job in Cybersecurity, start with Web App Security.
-   **Be Specific**: Avoid generic advice like 'practice coding'. Instead, give concrete tasks, e.g., 'Solve 10 problems on LeetCode Arrays this week'.
-   **Be Motivational but Realistic**: Encourage the user while setting achievable expectations.
-   **JSON Output Only**: The final output must be a single, valid JSON object with the exact keys: \`careerRoadmap\`, \`learningPlan\`, \`weeklyTasks\`, \`projects\`, \`careerTips\`, \`careerMilestones\`, \`freeResources\`. Do not include any markdown or explanatory text outside of the JSON structure.
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
