/**
 * Copyright 2025 Pathfinder AI Contributors
 *
 * Licensed under the Apache 2.0 License.
 * See LICENSE-APACHE for details.
 */

"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { careerPathExploration, type CareerPathExplorationOutput } from "@/ai/flows/career-path-exploration";
import { doc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, TrendingUp } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { Badge } from "../ui/badge";

const formSchema = z.object({
  degreeCourse: z.string().min(3, "Please enter a valid degree course.").max(100),
});

export function CareerPathExploration() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CareerPathExplorationOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { degreeCourse: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setResult(null);
    const user = auth.currentUser;

    try {
      const res = await careerPathExploration(values);
      setResult(res);
      
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const historyCollectionRef = collection(userDocRef, "careerExplorationHistory");
        addDoc(historyCollectionRef, {
          inputs: values,
          result: res,
          createdAt: serverTimestamp(),
        }).catch((error) => {
            console.error("Failed to save history:", error);
            // Non-critical error, so just log it and maybe notify user if needed
            toast({
              variant: "destructive",
              title: "History Warning",
              description: "Could not save your career exploration to your history.",
            });
        });
      }

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to explore career paths. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-accent" />
          Career Path Exploration
        </CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-grow">
          <CardContent className="flex-grow">
            <FormField
              control={form.control}
              name="degreeCourse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Degree Course</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Computer Science" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Exploring..." : "Explore Paths"}
            </Button>
          </CardFooter>
        </form>
      </Form>

      {loading && (
        <div className="p-6 border-t border-white/20 dark:border-white/10 space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {result && (
        <div className="p-6 border-t border-white/20 dark:border-white/10 space-y-4">
          <div>
            <h4 className="font-semibold">Potential Career Paths</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {result.careerPaths.map((path) => (
                <Badge key={path}>{path}</Badge>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold">Required Skills</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {result.requiredSkills.map((skill) => (
                <Badge key={skill} variant="secondary">{skill}</Badge>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4"/>Job Market Trends</h4>
            <p className="text-muted-foreground text-sm mt-2">{result.jobMarketTrends}</p>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
