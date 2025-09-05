
'use server';

/**
 * @fileOverview Type definitions for all AI flows.
 * This file contains Zod schemas and TypeScript types used across the different
 * AI-powered features of the application.
 */

import {z} from 'genkit';

// -----------------------------------------------------------------------------
// Career Path Exploration
// -----------------------------------------------------------------------------

export const CareerPathExplorationInputSchema = z.object({
  degreeCourse: z.string().describe('The degree course chosen by the student.'),
});
export type CareerPathExplorationInput = z.infer<typeof CareerPathExplorationInputSchema>;

export const CareerPathExplorationOutputSchema = z.object({
  careerPaths: z
    .array(z.string())
    .describe('An array of potential career paths related to the degree course.'),
  requiredSkills: z
    .array(z.string())
    .describe('An array of required skills for the potential career paths.'),
  jobMarketTrends: z.string().describe('The job market trends for the potential career paths.'),
});
export type CareerPathExplorationOutput = z.infer<typeof CareerPathExplorationOutputSchema>;


// -----------------------------------------------------------------------------
// Degree Course Recommendation
// -----------------------------------------------------------------------------

export const DegreeCourseRecommendationInputSchema = z.object({
    stream: z
      .string()
      .describe('The student\'s chosen stream after class 12 (e.g., Science, Arts, Commerce).'),
    aptitude: z
      .string()
      .describe(
        'Aptitude and academic performance of the student, including grades and areas of strength.'
      ),
    careerGoals: z
      .string()
      .describe(
        'The student\'s career goals and aspirations. Include specific fields or industries of interest.'
      ),
  });
  export type DegreeCourseRecommendationInput = z.infer<
    typeof DegreeCourseRecommendationInputSchema
  >;
  
  export const DegreeCourseRecommendationOutputSchema = z.object({
    recommendedCourses: z
      .array(z.string())
      .describe('A list of recommended degree courses based on the input.'),
    rationale: z
      .string()
      .describe(
        'Detailed rationales for each recommended course, incorporating information from past successful student paths.'
      ),
  });
  export type DegreeCourseRecommendationOutput = z.infer<
    typeof DegreeCourseRecommendationOutputSchema
  >;


// -----------------------------------------------------------------------------
// Interest Profiler
// -----------------------------------------------------------------------------

export const InterestProfilerInputSchema = z.object({
    interests: z
      .string()
      .describe(
        'A list of student interests, separated by commas, e.g., science, art, sports.'
      ),
    academicPerformance: z
      .string()
      .describe(
        'A description of the students academic performance, including grades in different subjects.'
      ),
    careerGoals: z
      .string()
      .describe('A description of the students career goals.'),
  });
  export type InterestProfilerInput = z.infer<typeof InterestProfilerInputSchema>;
  
  export const InterestProfilerOutputSchema = z.object({
    streamSuggestion: z
      .string()
      .describe(
        'The suggested stream (Science, Arts, Commerce, etc.) based on the student interests, academic performance, and career goals.'
      ),
    courseSuggestion: z
      .string()
      .describe(
        'The suggested degree course based on the chosen stream, student aptitude, and career goals.'
      ),
    rationale: z
      .string()
      .describe(
        'A detailed rationale for the stream and course suggestions, incorporating information from past successful student paths.'
      ),
  });
  export type InterestProfilerOutput = z.infer<typeof InterestProfilerOutputSchema>;


// -----------------------------------------------------------------------------
// Stream Suggestion
// -----------------------------------------------------------------------------

export const SuggestStreamInputSchema = z.object({
    interests: z
      .string()
      .describe('The student\'s interests, such as science, arts, or business.'),
    academicPerformance: z
      .string()
      .describe(
        'The student\'s academic performance in class 10, including grades in relevant subjects.'
      ),
  });
  export type SuggestStreamInput = z.infer<typeof SuggestStreamInputSchema>;
  
  export const SuggestStreamOutputSchema = z.object({
    suggestedStream: z
      .string()
      .describe(
        'The suggested stream for the student (Science, Arts, Commerce, etc.).'
      ),
    reasoning: z
      .string()
      .describe(
        'The reasoning behind the stream suggestion, based on the student\'s interests and academic performance.'
      ),
  });
  export type SuggestStreamOutput = z.infer<typeof SuggestStreamOutputSchema>;
