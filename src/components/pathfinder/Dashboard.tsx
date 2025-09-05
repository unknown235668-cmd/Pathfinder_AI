
'use client';

import {useEffect, useState} from 'react';
import {auth, db} from '@/lib/firebase';
import {collection, getDocs, orderBy, query, Timestamp, DocumentData} from 'firebase/firestore';
import type {User} from 'firebase/auth';
import {GlassCard} from './GlassCard';
import {Card, CardContent, CardHeader, CardTitle} from '../ui/card';
import {Skeleton} from '../ui/skeleton';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '../ui/accordion';
import {Badge} from '../ui/badge';
import {BookOpen, Briefcase, GraduationCap, Lightbulb, TrendingUp} from 'lucide-react';

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
        let allHistory: HistoryItem[] = [];
        
        for (const [key, config] of Object.entries(HISTORY_CONFIG)) {
            const historyCollectionRef = collection(db, `users/${uid}/${key}`);
            const q = query(historyCollectionRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const historyData = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    type: config.type,
                    inputs: data.inputs,
                    result: data.result,
                    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
                }
            });
            allHistory = [...allHistory, ...historyData];
        }

        allHistory.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        setHistory(allHistory);
        setLoading(false);
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
              <p className="text-muted-foreground">Your personal guide to a bright future. Please log in to save and view your progress.</p>
          </CardContent>
      </GlassCard>
    )
  }

  if (history.length === 0) {
    return (
        <GlassCard>
            <CardHeader>
                <CardTitle>Welcome, {user.displayName || 'student'}!</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">You haven't used any tools yet. Select a tool from the tabs above to get started on your pathfinding journey!</p>
            </CardContent>
        </GlassCard>
    );
  }

  return (
    <GlassCard>
        <CardHeader>
            <CardTitle>Your Journey So Far</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
    </GlassCard>
  )
}
