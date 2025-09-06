
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
You are an expert career coach and technical mentor. 
A user with the following profile needs a personalized step-by-step career plan.

**User Profile:**
- **Current Skills:** {{{currentSkills}}}
- **Interests / Goals:** {{{interestsGoals}}}
- **Experience Level:** {{{experienceLevel}}}
- **Desired Career Outcome:** {{{desiredCareerOutcome}}}

**Your Task:**
Generate a detailed, actionable, and encouraging step-by-step plan to help the user achieve their desired career outcome. The plan should be structured logically. For each step, provide a clear title, a concise description of what to do, and why it's important.

**Example Structure:**
1.  **Phase 1: Strengthen Your Foundation (Months 1-2)**
    -   Deepen HTML/CSS/JS knowledge.
    -   Master responsive design.
2.  **Phase 2: Learn a Modern Framework (Months 3-4)**
    -   Choose and master React or Vue.
    -   Learn state management.
3.  **Phase 3: Build & Showcase (Months 5-6)**
    -   Create 2-3 portfolio projects.
    -   Contribute to an open-source project.
4.  **Phase 4: Job Readiness (Month 7)**
    -   Prepare your resume and portfolio.
    -   Practice technical interviews.

Your response must be in the structured JSON format defined in the output schema.
`
        },
        input
    );

    return output!;
}
