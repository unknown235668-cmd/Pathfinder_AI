
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
    "beginner": "Detailed step-by-step guidance with a 1-3 month timeline. Include specific skills to learn (e.g., 'React Hooks'), tools to master (e.g., 'Git & GitHub'), and small projects to build (e.g., 'Todo App with Local Storage').",
    "intermediate": "Detailed step-by-step guidance with a 4-9 month timeline. Include more advanced skills (e.g., 'State Management with Redux'), professional tools (e.g., 'CI/CD pipelines'), and complex projects (e.g., 'E-commerce site with payment integration').",
    "advanced": "Detailed step-by-step guidance for 10+ months. Include expert-level skills (e.g., 'Micro-frontend architecture'), specialization areas (e.g., 'Performance Optimization'), and large-scale projects (e.g., 'Real-time collaborative application')."
  },
  "learningPlan": [
    "Comprehensive topic 1 (e.g., 'Advanced CSS') with a clear reason why it matters for the user's desired outcome.",
    "Comprehensive topic 2 (e.g., 'API Design Principles') with a clear reason why it matters.",
    "Comprehensive topic 3 (e.g., 'Testing methodologies') with a clear reason why it matters."
  ],
  "weeklyTasks": {
    "week1": ["Specific, actionable task for Day 1-2", "Specific, actionable task for Day 3-4", "Weekend goal or mini-project"],
    "week2": ["Specific, actionable task for Day 1-2", "Specific, actionable task for Day 3-4", "Weekend goal or mini-project"],
    "week3": ["Specific, actionable task for Day 1-2", "Specific, actionable task for Day 3-4", "Weekend goal or mini-project"],
    "week4": ["Specific, actionable task for Day 1-2", "Specific, actionable task for Day 3-4", "Weekend goal or mini-project"]
  },
  "projects": [
    "Detailed Project 1 description with a clear purpose and features to implement (e.g., 'Portfolio Website: A dynamic, responsive site built with a modern framework to showcase your skills and projects. Features: CSS animations, contact form, project gallery').",
    "Detailed Project 2 description with a clear purpose and features to implement.",
    "Detailed Project 3 description with a clear purpose and features to implement."
  ],
  "freeResources": [
    { "name": "Resource Name", "url": "https://..." },
    { "name": "Resource Name", "url": "https://..." },
    { "name": "Resource Name", "url": "https://..." }
  ],
  "careerTips": [
    "Insightful Tip 1 (e.g., 'Contribute to an open-source project to gain real-world collaboration experience.')",
    "Insightful Tip 2 (e.g., 'Write blog posts about what you learn to solidify your understanding and build a personal brand.')",
    "Insightful Tip 3"
  ],
  "milestones": [
    { "stage": "First Internship / Freelance Project", "expected_time": "6-8 months" },
    { "stage": "Full-time Job Application Readiness", "expected_time": "12-18 months" },
    { "stage": "Achieve Expert / Specialized Role", "expected_time": "24+ months" }
  ]
}

Rules:
- The roadmap must adapt 100% to the user’s profile (skills, level, and career goals).
- Do NOT output fixed or generic advice. Always customize dynamically.
- All tasks and projects should be practical, real-world, and progressively harder.
- In "freeResources", always give {name, url} objects. Return between 8 and 12 resources.
- The 'learningPlan' should contain at least 5-7 detailed topics.
- Recommend ONLY the most relevant free resources, no irrelevant ones.
- Provide both short-term wins (small projects, portfolio boosts) and long-term mastery milestones.
- Think like a mentor: challenge the user, don’t spoon-feed generic steps.
`
        },
        input
    );

    return output!;
}
