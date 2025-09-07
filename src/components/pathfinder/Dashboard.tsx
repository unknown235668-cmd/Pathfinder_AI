/**
 * Copyright 2025 Pathfinder AI Contributors
 *
 * Licensed under the MIT License or Apache 2.0 License.
 * See LICENSE-MIT or LICENSE-APACHE for details.
 */

'use client';

import {useEffect, useState} from 'react';
import {auth, db} from '@/lib/firebase';
import {collection, getDocs, orderBy, query, Timestamp, DocumentData} from 'firebase/firestore';
import type {User} from 'firebase/auth';
import {GlassCard} from './GlassCard';
import {CardContent, CardHeader, CardTitle, CardFooter} from '../ui/card';
import {Skeleton} from '../ui/skeleton';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '../ui/accordion';
import {Badge} from '../ui/badge';
import {BookOpen, Briefcase, GraduationCap, Lightbulb, TrendingUp, Bot, Award, Milestone, CheckCircle, MessageSquare} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Chatbot } from './Chatbot';


interface HistoryItem {
  id: string;
  type: string;
  inputs: any;
  result: any;
  createdAt: Date;
}

const HISTORY_CONFIG = {
    profilerHistory: {
        title: "Interest Profiler",
        icon: Lightbulb,
        type: "Interest Profiler"
    },
    streamSuggestionHistory: {
        title: "Stream Suggestion",
        icon: BookOpen,
        type: "Stream Suggestion"
    },
    degreeRecommendationHistory: {
        title: "Degree Recommendation",
        icon: GraduationCap,
        type: "Degree Recommendation"
    },
    careerExplorationHistory: {
        title: "Career Exploration",
        icon: Briefcase,
        type: "Career Exploration"
    },
    careerPlanHistory: {
        title: "Career Plan",
        icon: Bot,
        type: "Career Plan"
    }
}

function renderResult(item: HistoryItem) {
    switch (item.type) {
        case "Interest Profiler":
            return (
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold">Suggested Stream</h4>
                        <Badge variant="secondary" className="mt-1">{item.result.streamSuggestion}</Badge>
                    </div>
                    <div>
                        <h4 className="font-semibold">Suggested Course</h4>
                        <Badge variant="secondary" className="mt-1">{item.result.courseSuggestion}</Badge>
                    </div>
                    <div>
                        <h4 className="font-semibold">Rationale</h4>
                        <p className="text-sm text-muted-foreground">{item.result.rationale}</p>
                    </div>
                </div>
            )
        case "Stream Suggestion":
            return (
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold">Suggested Stream</h4>
                        <p className="font-bold text-primary">{item.result.suggestedStream}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold">Reasoning</h4>
                        <p className="text-sm text-muted-foreground">{item.result.reasoning}</p>
                    </div>
                </div>
            )
        case "Degree Recommendation":
             return (
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold">Recommended Courses</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {item.result.recommendedCourses.map((course: string) => (
                                <Badge key={course}>{course}</Badge>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold">Rationale</h4>
                        <p className="text-sm text-muted-foreground">{item.result.rationale}</p>
                    </div>
                </div>
            )
        case "Career Exploration":
            return (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">Potential Career Paths</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.result.careerPaths.map((path: string) => (
                        <Badge key={path}>{path}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold">Required Skills</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.result.requiredSkills.map((skill: string) => (
                        <Badge key={skill} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4"/>Job Market Trends</h4>
                    <p className="text-muted-foreground text-sm mt-2">{item.result.jobMarketTrends}</p>
                  </div>
                </div>
              )
        case "Career Plan":
            return (
                <div className="space-y-6">
                    <div>
                        <h4 className="font-semibold flex items-center gap-2"><Award className="h-4 w-4" />Career Roadmap</h4>
                        <div className="mt-2 space-y-2">
                            {Object.entries(item.result.careerRoadmap).map(([level, description]) => (
                                <div key={level} className="p-3 rounded-md bg-black/5 dark:bg-white/10">
                                    <h5 className="font-bold capitalize">{level}</h5>
                                    <p className="text-muted-foreground text-sm">{description as string}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold flex items-center gap-2"><Milestone className="h-4 w-4" />Career Milestones</h4>
                         <div className="mt-2 space-y-2">
                            {item.result.milestones?.map((milestone: any, index: number) => (
                                <div key={index} className="flex items-start gap-3 p-2 bg-black/5 dark:bg-white/10 rounded-md">
                                    <CheckCircle className="h-4 w-4 text-green-500 mt-1 shrink-0"/>
                                    <div>
                                      <p className="font-semibold">{milestone.stage}</p>
                                      <p className="text-sm text-muted-foreground">Metric: {milestone.metric}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold flex items-center gap-2"><Briefcase className="h-4 w-4" />Projects</h4>
                         <div className="mt-2 space-y-2">
                            {item.result.projects?.map((project: any, index: number) => (
                              <div key={index} className="p-3 rounded-md bg-black/5 dark:bg-white/10">
                                <h5 className="font-bold">{project.name}</h5>
                                <div className="flex flex-wrap gap-2 my-2">
                                  {project.technologies.map((tech: string) => <Badge key={tech} variant="secondary">{tech}</Badge>)}
                                </div>
                                <p className="text-sm text-muted-foreground">Scope: {project.scope}</p>
                              </div>
                            ))}
                        </div>
                    </div>
                </div>
            )
        default:
            return <p>{JSON.stringify(item.result, null, 2)}</p>
    }
}


export function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async (uid: string) => {
      setLoading(true);
      
      try {
        const historyPromises = Object.entries(HISTORY_CONFIG).map(async ([key, config]) => {
          const historyCollectionRef = collection(db, `users/${uid}/${key}`);
          const q = query(historyCollectionRef, orderBy('createdAt', 'desc'));
          const querySnapshot = await getDocs(q);
          
          return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              type: config.type,
              inputs: data.inputs,
              result: data.result,
              createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
            };
          });
        });

        const allHistoryArrays = await Promise.all(historyPromises);
        const allHistory = allHistoryArrays.flat();

        allHistory.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setHistory(allHistory);

      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged(newUser => {
      setUser(newUser);
      if (newUser) {
        fetchHistory(newUser.uid);
      } else {
        setHistory([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <GlassCard>
          <CardHeader>
              <CardTitle>Your Journey So Far</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
          </CardContent>
      </GlassCard>
    );
  }

  if (!user) {
    return (
      <GlassCard>
          <CardHeader>
              <CardTitle>Welcome to Pathfinder AI</CardTitle>
          </CardHeader>
          <CardContent>
              <p className="text-muted-foreground">Your personal guide to a bright future. Please log in to save and view your progress and to use the chat assistant.</p>
          </CardContent>
           <CardFooter>
                <p className="text-sm text-muted-foreground">To access the AI advisor, please log in.</p>
           </CardFooter>
      </GlassCard>
    )
  }

  return (
    <Dialog>
        <GlassCard>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Your Journey So Far</CardTitle>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <Bot className="mr-2 h-4 w-4" />
                        AI Advisor
                    </Button>
                </DialogTrigger>
            </CardHeader>
            <CardContent>
            {history.length === 0 ? (
                  <p className="text-muted-foreground">You haven't used any tools yet. Select a tool from the tabs above to get started on your pathfinding journey!</p>
            ) : (
                <Accordion type="single" collapsible className="w-full">
                    {history.map(item => {
                        const Icon = HISTORY_CONFIG[Object.keys(HISTORY_CONFIG).find(key => HISTORY_CONFIG[key as keyof typeof HISTORY_CONFIG].type === item.type)! as keyof typeof HISTORY_CONFIG].icon;
                        return (
                            <AccordionItem value={item.id} key={item.id}>
                                <AccordionTrigger className="text-left">
                                    <div className="flex items-center gap-3">
                                        <Icon className="h-5 w-5 text-accent"/>
                                        <div>
                                            <p className="font-semibold">{item.type}</p>
                                            <p className="text-xs text-muted-foreground font-normal">
                                                {item.createdAt.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 bg-black/10 dark:bg-white/5 rounded-md">
                                    {renderResult(item)}
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                </Accordion>
            )}
            </CardContent>
        </GlassCard>
      <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
              <DialogTitle className="flex items-center gap-2"><Bot /> AI Advisor</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-hidden px-6 pb-6">
              <Chatbot />
          </div>
      </DialogContent>
    </Dialog>
  )
}

    
