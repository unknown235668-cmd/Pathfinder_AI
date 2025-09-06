
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
import { Bot, Check, ChevronsUpDown, Loader2, Award, Briefcase, Calendar, ListChecks, Lightbulb, Link as LinkIcon, Milestone } from "lucide-react";
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
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error Generating Plan",
        description: error.message || "Failed to generate a plan. The AI may be busy. Please try again.",
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
        <div className="p-6 border-t border-white/20 dark:border-white/10 space-y-8">
          <Accordion type="multiple" className="w-full space-y-4" defaultValue={["roadmap", "learning-plan"]}>
            
            {/* Roadmap */}
            <AccordionItem value="roadmap" className="border-none">
              <AccordionTrigger className="text-xl font-semibold p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                <div className="flex items-center gap-3"><Award className="h-6 w-6 text-primary"/>Career Roadmap</div>
              </AccordionTrigger>
              <AccordionContent className="p-4 space-y-4">
                {Object.entries(result.careerRoadmap).map(([level, description]) => (
                    <div key={level} className="p-4 rounded-md bg-black/5 dark:bg-white/5">
                        <h4 className="font-bold capitalize">{level}</h4>
                        <p className="text-muted-foreground text-sm">{description}</p>
                    </div>
                ))}
              </AccordionContent>
            </AccordionItem>

            {/* Learning Plan */}
            <AccordionItem value="learning-plan" className="border-none">
                <AccordionTrigger className="text-xl font-semibold p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3"><ListChecks className="h-6 w-6 text-primary"/>Learning Plan</div>
                </AccordionTrigger>
                <AccordionContent className="p-4">
                    <ul className="space-y-2 list-disc list-inside">
                        {result.learningPlan?.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                </AccordionContent>
            </AccordionItem>

            {/* Weekly Tasks */}
            <AccordionItem value="weekly-tasks" className="border-none">
                <AccordionTrigger className="text-xl font-semibold p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3"><Calendar className="h-6 w-6 text-primary"/>Weekly Tasks</div>
                </AccordionTrigger>
                <AccordionContent className="p-4 space-y-3">
                    {Object.entries(result.weeklyTasks).map(([week, tasks]) => (
                        <div key={week}>
                            <h4 className="font-semibold capitalize">{week.replace('week', 'Week ')}</h4>
                            <ul className="list-disc list-inside text-muted-foreground text-sm pl-2">
                                {tasks.map((task, i) => <li key={i}>{task}</li>)}
                            </ul>
                        </div>
                    ))}
                </AccordionContent>
            </AccordionItem>
            
            {/* Projects */}
            <AccordionItem value="projects" className="border-none">
                <AccordionTrigger className="text-xl font-semibold p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3"><Briefcase className="h-6 w-6 text-primary"/>Projects</div>
                </AccordionTrigger>
                <AccordionContent className="p-4">
                    <ul className="space-y-2 list-disc list-inside">
                       {result.projects?.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                </AccordionContent>
            </AccordionItem>

             {/* Career Tips */}
             <AccordionItem value="career-tips" className="border-none">
                <AccordionTrigger className="text-xl font-semibold p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3"><Lightbulb className="h-6 w-6 text-primary"/>Career Tips</div>
                </AccordionTrigger>
                <AccordionContent className="p-4">
                    <ul className="space-y-2 list-disc list-inside">
                       {result.careerTips?.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                </AccordionContent>
            </AccordionItem>

            {/* Milestones */}
            <AccordionItem value="milestones" className="border-none">
                <AccordionTrigger className="text-xl font-semibold p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3"><Milestone className="h-6 w-6 text-primary"/>Career Milestones</div>
                </AccordionTrigger>
                <AccordionContent className="p-4 space-y-3">
                    {result.milestones?.map((item, index) => (
                        <div key={index} className="flex items-center gap-4">
                            <Badge>{item.expected_time}</Badge>
                            <p className="font-semibold">{item.stage}</p>
                        </div>
                    ))}
                </AccordionContent>
            </AccordionItem>
            
             {/* Free Resources */}
             <AccordionItem value="free-resources" className="border-none">
                <AccordionTrigger className="text-xl font-semibold p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3"><LinkIcon className="h-6 w-6 text-primary"/>Free Resources</div>
                </AccordionTrigger>
                <AccordionContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.freeResources?.map((resource, index) => (
                        <a href={resource.url} target="_blank" rel="noopener noreferrer" key={index} className="block p-3 bg-black/10 dark:bg-white/10 rounded-md hover:bg-black/20 dark:hover:bg-white/20 transition-colors">
                           <p className="font-semibold text-primary">{resource.name}</p>
                           <p className="text-xs text-muted-foreground truncate">{resource.url}</p>
                        </a>
                    ))}
                </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>
      )}
    </GlassCard>
  );
}

    