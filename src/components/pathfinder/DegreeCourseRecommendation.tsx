"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { recommendDegreeCourses, type DegreeCourseRecommendationOutput } from "@/ai/flows/degree-course-recommendation-after-12";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { Badge } from "../ui/badge";

const formSchema = z.object({
  stream: z.string({ required_error: "Please select a stream." }),
  aptitude: z.string().min(10, "Describe your aptitude.").max(300),
  careerGoals: z.string().min(10, "Describe your career goals.").max(300),
});

export function DegreeCourseRecommendation() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DegreeCourseRecommendationOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { aptitude: "", careerGoals: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setResult(null);
    try {
      const res = await recommendDegreeCourses(values);
      setResult(res);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get recommendations. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-accent" />
          Degree Course Recommendation
        </CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-grow">
          <CardContent className="space-y-4 flex-grow">
            <FormField
              control={form.control}
              name="stream"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Stream (After 12th)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your stream" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Science">Science</SelectItem>
                      <SelectItem value="Commerce">Commerce</SelectItem>
                      <SelectItem value="Arts">Arts / Humanities</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="aptitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aptitude & Strengths</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Good at logical reasoning, creative problem solving..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="careerGoals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Career Goals</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Become a data scientist, start my own business..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Recommending..." : "Recommend Courses"}
            </Button>
          </CardFooter>
        </form>
      </Form>

      {loading && (
        <div className="p-6 border-t border-white/20 dark:border-white/10">
          <Skeleton className="h-6 w-1/4 mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-8 w-3/4" />
          </div>
        </div>
      )}

      {result && (
        <div className="p-6 border-t border-white/20 dark:border-white/10 space-y-4">
          <div>
            <h4 className="font-semibold">Recommended Courses</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {result.recommendedCourses.map((course) => (
                <Badge key={course} variant="secondary">{course}</Badge>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold">Rationale</h4>
            <p className="text-muted-foreground text-sm mt-2">{result.rationale}</p>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
