
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { generateCareerPlan, type CareerPlanOutput } from "@/ai/flows/career-plan-generator";
import { doc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Bot, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Badge } from "../ui/badge";

const formSchema = z.object({
  currentSkills: z.string().min(10, "Please list your key skills.").max(200),
  interestsGoals: z.string().min(10, "Please describe your interests and goals.").max(300),
  experienceLevel: z.string({ required_error: "Please select your experience level." }),
  desiredCareerOutcome: z.string().min(3, "Please enter a career outcome.").max(100),
});

export function CareerPlanGenerator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CareerPlanOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentSkills: "JavaScript, HTML, CSS",
      interestsGoals: "Web Development, UI/UX Design",
      experienceLevel: "Beginner",
      desiredCareerOutcome: "Frontend Developer",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setResult(null);
    const user = auth.currentUser;

    try {
      const res = await generateCareerPlan(values);
      setResult(res);

      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const historyCollectionRef = collection(userDocRef, "careerPlanHistory");
        addDoc(historyCollectionRef, {
          inputs: values,
          result: res,
          createdAt: serverTimestamp(),
        }).catch((error) => {
            console.error("Failed to save history:", error);
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate a plan. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
          <Bot className="h-6 w-6 text-accent" />
          AI Career Plan Generator
        </CardTitle>
        <CardDescription>
          Tell us about yourself, and our AI will generate a personalized step-by-step roadmap to help you achieve your career goals.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="currentSkills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Skills</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., JavaScript, HTML, CSS, Python" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interestsGoals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interests / Goals</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Web Development, Machine Learning, UI/UX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="experienceLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your experience level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="desiredCareerOutcome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desired Career Outcome</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Frontend Developer, Data Scientist" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading} size="lg">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating My Plan...
                </>
              ) : (
                "Generate My Plan"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>

      {loading && (
        <div className="p-6 border-t border-white/20 dark:border-white/10 space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="space-y-3 pt-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      )}

      {result && (
        <div className="p-6 border-t border-white/20 dark:border-white/10 space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-primary">{result.planTitle}</h3>
            <p className="text-muted-foreground">{result.introduction}</p>
          </div>
          <Accordion type="single" collapsible className="w-full" defaultValue="phase-0">
            {result.phases.map((phase, index) => (
              <AccordionItem value={`phase-${index}`} key={index}>
                <AccordionTrigger className="text-lg font-semibold">
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="text-base">{phase.timeline}</Badge>
                    <span>{phase.phaseTitle}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 bg-black/10 dark:bg-white/5 rounded-md">
                  <ul className="space-y-4">
                    {phase.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 shrink-0 mt-1" />
                        <div>
                          <h5 className="font-semibold">{step.title}</h5>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                          <p className="text-xs italic text-muted-foreground/80 mt-1">{step.rationale}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className="text-muted-foreground pt-4 border-t border-border">{result.conclusion}</p>
        </div>
      )}
    </GlassCard>
  );
}
