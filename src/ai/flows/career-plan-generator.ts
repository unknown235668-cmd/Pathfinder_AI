
'use server';

/**
 * @fileOverview Generates a personalized career plan for students.
 * 
 * - generateCareerPlan - A function that generates a career plan.
 * - CareerPlanInput - The input type for the generateCareerPlan function.
 * - CareerPlanOutput - The return type for the generateCareerPlan function.
 */

import { definePromptWithFallback } from '@/ai/genkit';
import {
    CareerPlanInput,
    CareerPlanOutput,
    CareerPlanInputSchema,
    CareerPlanOutputSchema
} from './types';

export async function generateCareerPlan(
    input: CareerPlanInput
): Promise<CareerPlanOutput> {
    const { output } = await definePromptWithFallback(
        {
            name: 'careerPlanPrompt',
            input: { schema: CareerPlanInputSchema },
            output: { schema: CareerPlanOutputSchema },
            prompt: `
You are an expert AI Career Mentor. Your job is to generate highly specific, actionable, time-bound career roadmaps tailored to the user’s background and goals. The roadmap must read like a step-by-step personal mentor plan, not generic advice. Be concrete, structured, and realistic.

When a user provides their Current Skills, Interests/Goals, Experience Level, and Desired Career Outcome, generate a roadmap with these sections:

1. **Career Roadmap** – Break the journey into clear phases (beginner, intermediate, advanced) with explicit timelines (e.g., Months 1–3, 4–6, etc.) and measurable skill goals.

2. **Learning Plan** – A month-by-month breakdown of what to study, why it matters, and the outcomes. Each topic must include 1–2 recommended free or reliable resources.

3. **Weekly Tasks (First 12 Weeks)** – Give weekly step-by-step tasks that progressively increase in difficulty (learning + projects). No vague advice like 'practice coding'; each task should be specific and achievable.

4. **Projects** – Portfolio-ready project ideas at beginner, intermediate, and advanced levels. For each project, explain scope, technologies used, expected outcome, and how to document it (GitHub README, demo link, etc.).

5. **Career Tips** – Actionable strategies for building a strong online presence, optimizing GitHub, LinkedIn, resumes, networking, and preparing for technical interviews. Avoid fluff; give specific steps and tools.

6. **Career Milestones** – Measurable checkpoints at 3, 6, 12, and 18–24 months. Each milestone must include specific outcomes such as number of projects completed, certifications, internships, interview readiness, or first job.

7. **Free Resources** – A curated list of high-quality free resources (docs, tutorials, platforms, labs) mapped to the roadmap stages.

User Input:
- Current Skills: {{{currentSkills}}}
- Interests / Goals: {{{interestsGoals}}}
- Experience Level: {{{experienceLevel}}}
- Desired Career Outcome: {{{desiredCareerOutcome}}}

⚡ Rules:
- Always tie the roadmap to the user’s background (e.g., if user knows JavaScript and wants Cybersecurity, emphasize Web App Security early).
- Avoid vague filler like 'gain hands-on experience'; instead give concrete labs, platforms, or project tasks.
- Return a valid JSON object with the following keys: careerRoadmap, learningPlan, weeklyTasks, projects, careerTips, careerMilestones, freeResources.
- Ensure JSON is valid and matches the human-readable content.
`
        },
        input
    );

    return output!;
}
