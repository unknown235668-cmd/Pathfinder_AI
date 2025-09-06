
'use server';

/**
 * @fileOverview Generates a personalized career plan for students.
 *
 * Exports:
 * - generateCareerPlan: Main function to create a career roadmap.
 * - CareerPlanInput & CareerPlanOutput: Strongly typed input/output contracts.
 */

import { definePromptWithFallback } from '@/ai/genkit';
import {
  CareerPlanInput,
  CareerPlanOutput,
  CareerPlanInputSchema,
  CareerPlanOutputSchema,
} from './types';

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
You are an **AI Career Mentor**. Your job is to create a highly specific, actionable, and realistic **career roadmap** for the user. 
The roadmap must feel like a **step-by-step mentoring plan** with clear timelines, measurable goals, and concrete tasks.

User Input:
- Current Skills: {{{currentSkills}}}
- Interests / Goals: {{{interestsGoals}}}
- Experience Level: {{{experienceLevel}}}
- Desired Career Outcome: {{{desiredCareerOutcome}}}

### Sections to Include:

1. **Career Roadmap**
   - Break the journey into phases (Beginner, Intermediate, Advanced).
   - Add explicit timelines (Months 1–3, 4–6, etc.).
   - Define measurable goals for each phase.

2. **Learning Plan**
   - A month-by-month breakdown of skills & topics.
   - Explain *why* each topic matters and expected outcomes.
   - Include 1–2 high-quality resources (free when possible).

3. **Weekly Tasks (First 12 Weeks)**
   - Step-by-step weekly breakdown.
   - Each task should be **specific & achievable** (avoid vague "practice coding").
   - Mix learning + hands-on (labs, projects, coding challenges).

4. **Projects**
   - Portfolio-ready project ideas (Beginner, Intermediate, Advanced).
   - For each: scope, tech stack, expected outcome, documentation tips (GitHub README, demo links).

5. **Career Tips**
   - Actionable strategies for:
     - GitHub profile optimization
     - LinkedIn networking
     - Resume building
     - Mock interview prep
   - Tools & platforms to use.

6. **Career Milestones**
   - Concrete checkpoints at 3, 6, 12, and 18–24 months.
   - Outcomes can include: X projects completed, Y certifications, Z internships, or landing a job.

7. **Free Resources**
   - Curated list of free docs, tutorials, labs, and platforms.
   - Map each resource to the relevant roadmap stage.

⚡ Rules:
- Always tie roadmap to user’s **background & goals** (e.g., if user knows JS and wants Cybersecurity → start with Web App Security).
- Do not return vague advice like "gain experience"; always provide **specific tasks or platforms**.
- Format response as **valid JSON only** with keys:
  - careerRoadmap
  - learningPlan
  - weeklyTasks
  - projects
  - careerTips
  - careerMilestones
  - freeResources
- Do not include markdown, comments, or extra text outside JSON.
      `,
    },
    input
  );

  if (!output) {
    throw new Error('Failed to generate career plan. No output returned.');
  }

  return output;
}
