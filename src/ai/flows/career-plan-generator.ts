
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
You are the ultimate Career Architect AI.
Your job is to generate a dynamic, personalized, end-to-end career roadmap for the user based on their input.

User Input:
- Current Skills: {{{currentSkills}}}
- Interests / Goals: {{{interestsGoals}}}
- Experience Level: {{{experienceLevel}}}
- Desired Career Outcome: {{{desiredCareerOutcome}}}

Return strict JSON only in this format (no explanations, no extra text):

{
  "careerRoadmap": {
    "beginner": "Step-by-step guidance with timeline (skills, tools, projects).",
    "intermediate": "Step-by-step guidance with timeline (skills, tools, projects).",
    "advanced": "Step-by-step guidance with timeline (skills, tools, projects)."
  },
  "learningPlan": [
    "topic 1 with reason why it matters",
    "topic 2 ...",
    "topic 3 ..."
  ],
  "weeklyTasks": {
    "week1": ["specific actionable tasks"],
    "week2": ["specific actionable tasks"],
    "week3": ["specific actionable tasks"],
    "week4": ["specific actionable tasks"]
  },
  "projects": [
    "Project 1 description with purpose",
    "Project 2 description with purpose",
    "Project 3 description with purpose"
  ],
  "freeResources": [
    { "name": "Resource Name", "url": "https://..." },
    { "name": "Resource Name", "url": "https://..." },
    { "name": "Resource Name", "url": "https://..." }
  ],
  "careerTips": [
    "Tip 1",
    "Tip 2",
    "Tip 3"
  ],
  "milestones": [
    { "stage": "First Internship / Freelance", "expected_time": "6-8 months" },
    { "stage": "Full-time Job / Advanced Projects", "expected_time": "12-18 months" },
    { "stage": "Expert / Specialized Role", "expected_time": "24+ months" }
  ]
}

Rules:
- The roadmap must adapt 100% to the user’s profile (skills, level, and career goals).
- Do NOT output fixed or generic advice. Always customize dynamically.
- All tasks and projects should be practical, real-world, and progressively harder.
- In "freeResources", always give {name, url} objects.
- Recommend ONLY the most relevant free resources, no irrelevant ones.
- Provide both short-term wins (small projects, portfolio boosts) and long-term mastery milestones.
- Think like a mentor: challenge the user, don’t spoon-feed generic steps.
`
        },
        input
    );

    return output!;
}
