
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
You are an expert AI Career Mentor. Your task is to generate a highly specific, step-by-step career roadmap tailored to the user’s background, skills, and goals. The roadmap must be progression-oriented, actionable, and avoid vague suggestions.

User Input:
- Current Skills: {{{currentSkills}}}
- Interests / Goals: {{{interestsGoals}}}
- Experience Level: {{{experienceLevel}}}
- Desired Career Outcome: {{{desiredCareerOutcome}}}

Return strict JSON only in this format (no explanations, no extra text):

{
  "careerRoadmap": {
    "beginner": "Detailed step-by-step guidance for the first 1-3 months. Include specific skills to learn (e.g., 'React Hooks'), tools to master (e.g., 'Git & GitHub'), and small, foundational projects to build (e.g., 'A responsive portfolio website from scratch').",
    "intermediate": "Detailed step-by-step guidance for months 4-9. Include more advanced skills (e.g., 'State Management with Redux/Zustand'), professional tools (e.g., 'CI/CD pipelines with GitHub Actions'), and complex projects (e.g., 'E-commerce site with payment integration and user auth').",
    "advanced": "Detailed step-by-step guidance for months 10+. Include expert-level skills (e.g., 'Micro-frontend architecture'), specialization areas (e.g., 'Performance Optimization & Web Vitals'), and large-scale projects (e.g., 'Real-time collaborative application using WebSockets')."
  },
  "learningPlan": [
    "Comprehensive Topic 1 (e.g., 'Advanced CSS & Animations'): Explain why it's critical for their goal (e.g., 'to build modern, engaging user interfaces that stand out'). Mention specific resources and what they will achieve.",
    "Comprehensive Topic 2 (e.g., 'API Design & Integration'): Explain its importance (e.g., 'to connect their frontend applications to backend services, a core skill for any web developer').",
    "Comprehensive Topic 3 (e.g., 'Testing Methodologies - Jest & React Testing Library'): Explain why it matters (e.g., 'to write reliable, bug-free code, which is highly valued by employers')."
  ],
  "weeklyTasks": {
    "week1": ["Specific, actionable task for Day 1-2 (e.g., 'Setup development environment: VS Code, Node.js, Git')", "Specific task for Day 3-4 (e.g., 'Complete the first 3 modules of a recommended React course')", "Weekend goal (e.g., 'Build a simple To-Do App with React state')"],
    "week2": ["Specific task for Day 1-2 (e.g., 'Build 3 responsive landing pages')", "Specific task for Day 3-4", "Weekend goal or mini-project"],
    "week3": ["Specific task for Day 1-2 (e.g., 'Set up a virtual lab and run a CTF')", "Specific task for Day 3-4", "Weekend goal or mini-project"],
    "week4": ["Specific task for Day 1-2", "Specific task for Day 3-4", "Weekend goal or mini-project"]
  },
  "projects": [
    "Project Idea 1: Portfolio-ready project with a detailed description, objectives, skills learned, and advice on documenting/showcasing. (e.g., 'Interactive Data Dashboard: Build a dashboard that fetches data from a public API and displays it using a charting library like Chart.js or Recharts. Objectives: API fetching, state management, data visualization. Skills: React, Axios, Chart.js. Showcase: Deploy on Vercel, write a blog post about the process.')",
    "Project Idea 2: Detailed description with objectives, skills learned, and advice on showcasing.",
    "Project Idea 3: Detailed description with objectives, skills learned, and advice on showcasing."
  ],
  "freeResources": [
    { "name": "Resource Name", "url": "https://..." },
    { "name": "Resource Name", "url": "https://..." },
    { "name": "Resource Name", "url": "https://..." }
  ],
  "careerTips": [
    "Actionable Tip 1 (e.g., 'Commit to GitHub every day. This builds a strong activity graph that impresses recruiters.')",
    "Actionable Tip 2 (e.g., 'Contribute to an open-source project. Find a beginner-friendly issue on a library you use.')",
    "Actionable Tip 3 (e.g., 'Optimize your LinkedIn profile with keywords from job descriptions for your target role.')"
  ],
  "milestones": [
    { "stage": "First Portfolio Project Complete (3 months)", "expected_time": "3 months" },
    { "stage": "Security+ Certification (6 months)", "expected_time": "6 months" },
    { "stage": "Landed Internship / First Freelance Project (8 months)", "expected_time": "8 months" },
    { "stage": "Full-time Job Application Readiness (12 months)", "expected_time": "12 months" }
  ]
}

Rules:
- The roadmap must adapt 100% to the user’s profile. If they know JS and want Cybersecurity, the roadmap must emphasize Web App Security.
- Do NOT output vague advice like 'keep learning'. All recommendations must be concrete, measurable, and actionable.
- In "freeResources", always give {name, url} objects. Return between 8 and 12 resources.
- The 'learningPlan' should contain at least 5-7 detailed topics.
- The 'weeklyTasks' should cover at least the first month with progressively harder tasks.
- 'projects' should include ideas for beginner, intermediate, and advanced levels.
- 'milestones' should have clear, measurable checkpoints at 3, 6, 12, and 18+ months.
`
        },
        input
    );

    return output!;
}
