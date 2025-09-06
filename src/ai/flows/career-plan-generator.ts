
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
You are an **AI Career Mentor**. Create a highly specific, actionable, and realistic career roadmap. 
It must read like a step-by-step mentoring plan with timelines, measurable goals, and concrete tasks.

User Input:
- Current Skills: {{{currentSkills}}}
- Interests / Goals: {{{interestsGoals}}}
- Experience Level: {{{experienceLevel}}}
- Desired Career Outcome: {{{desiredCareerOutcome}}}

### Sections to Include:

1. careerRoadmap
   - Phases: Beginner, Intermediate, Advanced (optionally Expert if relevant).
   - Timelines: e.g., Months 1–3, 4–6, etc.
   - Measurable goals for each phase.

2. learningPlan
   - Month-by-month breakdown of skills & topics.
   - For each: why it matters + expected outcome.
   - Add 1–2 high-quality free resources.

3. weeklyTasks
   - 12 weeks of detailed, achievable weekly tasks.
   - Must mix learning + projects.
   - Avoid vague actions.

4. projects
   - Beginner, Intermediate, Advanced project ideas.
   - Include scope, tech stack, expected outcome, and documentation tips.

5. careerTips
   - Actionable strategies for:
     - GitHub optimization
     - LinkedIn networking
     - Resume improvements
     - Mock interview prep
   - Include tools/platforms.

6. careerMilestones
   - Specific checkpoints: 3, 6, 12, 18–24 months.
   - Define concrete outcomes (projects, certs, internships, job readiness).

7. freeResources
   - Curated list of docs, tutorials, labs, and platforms.
   - Map each resource to relevant phase/stage.

⚡ Rules:
- Tie roadmap to user’s background & goals (e.g., if user knows JS → emphasize React early).
- Never output vague filler (e.g., “practice coding”).
- Return **valid JSON only** with the keys:
  careerRoadmap, learningPlan, weeklyTasks, projects, careerTips, careerMilestones, freeResources.
- Do not include markdown, comments, or text outside JSON.
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
