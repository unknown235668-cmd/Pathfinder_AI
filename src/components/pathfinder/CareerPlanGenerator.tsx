
"use client";

import { useState, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { generateCareerPlan, type CareerPlanOutput } from "@/ai/flows/career-plan-generator";
import { doc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import jsPDF from "jspdf";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Bot, Check, ChevronsUpDown, Loader2, Award, Briefcase, Calendar, ListChecks, Lightbulb, Link as LinkIcon, Milestone, BarChart, CheckCircle, Users, GitMerge, Presentation, Trophy, FileDown } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";

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
  const [exporting, setExporting] = useState(false);

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

  const handleExportPdf = () => {
    if (!result) return;
    setExporting(true);

    try {
      const doc = new jsPDF();
      let yPos = 15;
      const pageHeight = doc.internal.pageSize.height;
      const leftMargin = 15;
      const rightMargin = 195;
      const lineHeight = 7;
      const titleLineHeight = 10;
      
      const addPageIfNeeded = (spaceNeeded: number) => {
        if (yPos + spaceNeeded > pageHeight - 20) {
          doc.addPage();
          yPos = 15;
        }
      };

      // Title
      doc.setFontSize(18);
      doc.text(`Career Plan for ${form.getValues('desiredCareerOutcome')}`, doc.internal.pageSize.width / 2, yPos, { align: 'center' });
      yPos += titleLineHeight * 2;

      const addSection = (title: string, content: () => void) => {
        addPageIfNeeded(20);
        doc.setFontSize(14);
        doc.text(title, leftMargin, yPos);
        yPos += titleLineHeight;
        doc.setLineWidth(0.5);
        doc.line(leftMargin, yPos, rightMargin, yPos);
        yPos += lineHeight;
        doc.setFontSize(10);
        content();
        yPos += titleLineHeight; 
      };

      // Roadmap
      addSection("Career Roadmap", () => {
        Object.entries(result.careerRoadmap).forEach(([level, description]) => {
          addPageIfNeeded(15);
          doc.setFont(undefined, 'bold');
          doc.text(`${level.charAt(0).toUpperCase() + level.slice(1)}:`, leftMargin, yPos);
          doc.setFont(undefined, 'normal');
          const splitText = doc.splitTextToSize(description, rightMargin - leftMargin);
          doc.text(splitText, leftMargin, yPos + lineHeight);
          yPos += splitText.length * lineHeight + lineHeight;
        });
      });

      // Learning Plan
      addSection("Learning Plan", () => {
        result.learningPlan?.forEach(item => {
          addPageIfNeeded(10);
          const splitText = doc.splitTextToSize(`- ${item}`, rightMargin - leftMargin - 5);
          doc.text(splitText, leftMargin + 5, yPos);
          yPos += splitText.length * lineHeight;
        });
      });

      // Projects
      addSection("Projects", () => {
        result.projects?.forEach(project => {
          addPageIfNeeded(30);
          doc.setFont(undefined, 'bold');
          doc.text(project.name, leftMargin, yPos);
          yPos += lineHeight;
          doc.setFont(undefined, 'normal');
          
          doc.text(`Scope: ${project.scope}`, leftMargin, yPos, { maxWidth: rightMargin - leftMargin });
          yPos += doc.getTextDimensions(`Scope: ${project.scope}`, { maxWidth: rightMargin - leftMargin }).h + lineHeight;

          doc.text(`Technologies: ${project.technologies.join(', ')}`, leftMargin, yPos);
          yPos += lineHeight;
        });
      });

       // Milestones
      addSection("Career Milestones", () => {
        result.milestones?.forEach(item => {
          addPageIfNeeded(15);
          doc.setFont(undefined, 'bold');
          doc.text(`${item.stage} (${item.expected_time})`, leftMargin, yPos);
          doc.setFont(undefined, 'normal');
          yPos += lineHeight;
          doc.text(`Metric: ${item.metric}`, leftMargin + 5, yPos, { maxWidth: rightMargin - leftMargin - 5 });
          yPos += doc.getTextDimensions(`Metric: ${item.metric}`, { maxWidth: rightMargin - leftMargin - 5 }).h + lineHeight;
        });
      });

      // Career Tips
      addSection("Career Tips", () => {
        result.careerTips?.forEach(item => {
          addPageIfNeeded(10);
          const splitText = doc.splitTextToSize(`- ${item}`, rightMargin - leftMargin - 5);
          doc.text(splitText, leftMargin + 5, yPos);
          yPos += splitText.length * lineHeight;
        });
      });
      
      doc.save(`Career-Plan-for-${form.getValues('desiredCareerOutcome').replace(/\s+/g, '-')}.pdf`);

    } catch (error) {
      console.error("Failed to export PDF:", error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "An error occurred while exporting the plan to PDF.",
      });
    } finally {
      setExporting(false);
    }
  };


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
          <CardFooter className="flex items-center gap-4">
            <Button type="submit" disabled={loading} size="lg">
              {loading && !result ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating My Plan...
                </>
              ) : (
                "Generate My Plan"
              )}
            </Button>
            {result && (
                 <Button onClick={handleExportPdf} variant="outline" disabled={exporting}>
                    {exporting ? (
                         <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Exporting...
                         </>
                    ) : (
                        <>
                            <FileDown className="mr-2 h-4 w-4" />
                            Export as PDF
                        </>
                    )}
                </Button>
            )}
          </CardFooter>
        </form>
      </Form>

      {loading && !result &&(
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
        <div className="p-6 border-t border-white/20 dark:border-white/10 space-y-8 bg-background">
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
                <AccordionContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(result.weeklyTasks).map(([week, tasks]) => (
                        <div key={week} className="p-3 bg-black/5 dark:bg-white/5 rounded-md">
                            <h4 className="font-semibold capitalize border-b border-primary/20 pb-2 mb-2">{week.replace('week', 'Week ')}</h4>
                            <ul className="list-disc list-inside text-muted-foreground text-sm pl-2 space-y-1">
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
                <AccordionContent className="p-4 space-y-4">
                    {result.projects?.map((project, index) => (
                      <div key={index} className="p-4 rounded-md bg-black/5 dark:bg-white/5">
                        <h4 className="font-bold">{project.name}</h4>
                        <div className="flex flex-wrap gap-2 my-2">
                          {project.technologies.map(tech => <Badge key={tech} variant="secondary">{tech}</Badge>)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2"><span className="font-semibold text-foreground">Scope:</span> {project.scope}</p>
                        <p className="text-sm text-muted-foreground mb-2"><span className="font-semibold text-foreground">Outcome:</span> {project.outcome}</p>
                        <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Real-World Practice:</span> {project.realWorldPractice}</p>
                      </div>
                    ))}
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
                        <div key={index} className="flex items-start gap-4 p-3 bg-black/5 dark:bg-white/5 rounded-md">
                            <Badge className="mt-1">{item.expected_time}</Badge>
                            <div>
                              <p className="font-semibold">{item.stage}</p>
                              <p className="text-sm text-muted-foreground">Metric: {item.metric}</p>
                            </div>
                        </div>
                    ))}
                </AccordionContent>
            </AccordionItem>
            
             {/* Resources */}
             <AccordionItem value="resources" className="border-none">
                <AccordionTrigger className="text-xl font-semibold p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3"><LinkIcon className="h-6 w-6 text-primary"/>Resources</div>
                </AccordionTrigger>
                <AccordionContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.resources?.map((resource, index) => (
                        <a href={resource.url} target="_blank" rel="noopener noreferrer" key={index} className="block p-3 bg-black/10 dark:bg-white/10 rounded-md hover:bg-black/20 dark:hover:bg-white/20 transition-colors">
                           <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <p className="font-semibold text-primary">{resource.name}</p>
                                <Badge variant="outline" className="text-xs">{resource.stage}</Badge>
                            </div>
                             <Badge variant={resource.type === 'free' ? 'default' : 'secondary'} className={cn(resource.type === 'paid' && 'bg-amber-500/20 text-amber-500 border-amber-500/30', resource.type === 'interactive' && 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30', resource.type === 'tool' && 'bg-slate-500/20 text-slate-500 border-slate-500/30' )}>{resource.type}</Badge>
                           </div>
                           <p className="text-xs text-muted-foreground truncate">{resource.url}</p>
                        </a>
                    ))}
                </AccordionContent>
            </AccordionItem>

            {/* Real World Practice */}
            {result.realWorldPractice && (
              <AccordionItem value="real-world-practice" className="border-none">
                  <AccordionTrigger className="text-xl font-semibold p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3"><Users className="h-6 w-6 text-primary"/>Real World Practice</div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 grid md:grid-cols-2 gap-6">
                      <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2"><GitMerge className="h-5 w-5" /> Open Source</h4>
                          <ul className="list-disc list-inside text-muted-foreground text-sm pl-2 mt-1 space-y-1">
                              {result.realWorldPractice.openSource.map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                      </div>
                      <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2"><Presentation className="h-5 w-5" /> Communication Drills</h4>
                          <ul className="list-disc list-inside text-muted-foreground text-sm pl-2 mt-1 space-y-1">
                              {result.realWorldPractice.communication.map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                      </div>
                      <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2"><Trophy className="h-5 w-5" /> Challenges & Competitions</h4>
                          <ul className="list-disc list-inside text-muted-foreground text-sm pl-2 mt-1 space-y-1">
                              {result.realWorldPractice.challenges.map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                      </div>
                       <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2"><Briefcase className="h-5 w-5" /> Hands-on Labs</h4>
                          <ul className="list-disc list-inside text-muted-foreground text-sm pl-2 mt-1 space-y-1">
                              {result.realWorldPractice.labs.map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                      </div>
                  </AccordionContent>
              </AccordionItem>
            )}

            {/* Evaluation */}
             <AccordionItem value="evaluation" className="border-none">
                <AccordionTrigger className="text-xl font-semibold p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3"><BarChart className="h-6 w-6 text-primary"/>Evaluation & Growth</div>
                </AccordionTrigger>
                <AccordionContent className="p-4 grid md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold mb-2">Evaluation Schedule</h4>
                        <p className="text-muted-foreground text-sm">{result.evaluation?.schedule}</p>
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2">Methods</h4>
                        <ul className="list-disc list-inside text-muted-foreground text-sm pl-2 mt-1 space-y-1">
                            {result.evaluation?.methods.map((method, i) => <li key={i}>{method}</li>)}
                        </ul>
                    </div>
                     <div className="md:col-span-2">
                        <h4 className="font-semibold mb-2">Self-Assessment Checklist</h4>
                        <ul className="space-y-2 text-muted-foreground text-sm mt-1">
                            {result.evaluation?.checklist.map((item, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500"/>
                                <span>{item}</span>
                              </li>
                            ))}
                        </ul>
                    </div>
                </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>
      )}
    </GlassCard>
  );
}
