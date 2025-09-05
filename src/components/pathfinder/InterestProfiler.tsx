
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { interestProfiler, type InterestProfilerOutput } from "@/ai/flows/interest-profiler";
import { doc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, Sparkles } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { Badge } from "../ui/badge";

const formSchema = z.object({
  interests: z.string().min(20, "Please describe your interests in at least 20 characters.").max(500),
  academicPerformance: z.string().min(20, "Please describe your academic performance in at least 20 characters.").max(500),
  careerGoals: z.string().min(20, "Please describe your career goals in at least 20 characters.").max(500),
});

export function InterestProfiler() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InterestProfilerOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      interests: "",
      academicPerformance: "",
      careerGoals: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setResult(null);
    const user = auth.currentUser;

    try {
      const res = await interestProfiler(values);
      setResult(res);

      // Save to firestore in the background without awaiting
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const historyCollectionRef = collection(userDocRef, "profilerHistory");
        addDoc(historyCollectionRef, {
          inputs: values,
          result: res,
          createdAt: serverTimestamp(),
        }).then(() => {
            toast({ title: "Success", description: "Your profiler results have been saved to your account." });
        }).catch((error) => {
            console.error("Failed to save history:", error);
            toast({ variant: "destructive", title: "Warning", description: "Could not save your results to history." });
        });
      }

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get suggestions. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
          <Sparkles className="h-6 w-6 text-accent" />
          Comprehensive Interest Profiler
        </CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="interests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Interests</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Playing guitar, coding personal projects, reading science fiction..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="academicPerformance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Performance</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Scored 90% in Math and Science, but struggled with History. Enjoyed chemistry labs." {...field} />
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
                      <Textarea placeholder="e.g., I want to build software that helps people, or perhaps work in renewable energy." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Analyzing..." : "Get Your Profile"}
            </Button>
          </CardFooter>
        </form>
      </Form>

      {loading && (
        <div className="p-6 border-t border-white/20 dark:border-white/10">
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      )}

      {result && (
        <div className="p-6 border-t border-white/20 dark:border-white/10 space-y-6">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-primary" />
            AI-Powered Recommendations
          </h3>
          <div>
            <h4 className="font-semibold text-lg">Suggested Stream</h4>
            <Badge variant="secondary" className="text-base mt-2">{result.streamSuggestion}</Badge>
          </div>
          <div>
            <h4 className="font-semibold text-lg">Suggested Course</h4>
            <Badge variant="secondary" className="text-base mt-2">{result.courseSuggestion}</Badge>
          </div>
          <div>
            <h4 className="font-semibold text-lg">Rationale</h4>
            <p className="text-muted-foreground mt-2">{result.rationale}</p>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
