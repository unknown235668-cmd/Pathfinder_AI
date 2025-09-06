
'use client';

import { Header } from "@/components/pathfinder/Header";
import { InterestProfiler } from "@/components/pathfinder/InterestProfiler";
import { StreamSuggestion } from "@/components/pathfinder/StreamSuggestion";
import { DegreeCourseRecommendation } from "@/components/pathfinder/DegreeCourseRecommendation";
import { CareerPathExploration } from "@/components/pathfinder/CareerPathExploration";
import { CollegeLocator } from "@/components/pathfinder/CollegeLocator";
import { CareerPlanGenerator } from "@/components/pathfinder/CareerPlanGenerator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Compass, GraduationCap, Lightbulb, MapPin, Search, Bot, Sparkles } from "lucide-react";
import { Dashboard } from "@/components/pathfinder/Dashboard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Chatbot } from "@/components/pathfinder/Chatbot";


export default function Home() {
  return (
    <Dialog>
      <main className="min-h-screen w-full bg-gradient-to-br from-background via-background to-secondary/30">
        <Header />
        <div className="px-4 md:px-8 pb-16">
          <Tabs defaultValue="dashboard" className="mx-auto max-w-7xl">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 h-auto mb-8">
              <TabsTrigger value="dashboard" className="py-2"><Compass className="mr-2 h-4 w-4" />Dashboard</TabsTrigger>
              <TabsTrigger value="profiler" className="py-2"><Lightbulb className="mr-2 h-4 w-4" />Profiler</TabsTrigger>
              <TabsTrigger value="stream" className="py-2"><Search className="mr-2 h-4 w-4" />Stream</TabsTrigger>
              <TabsTrigger value="degree" className="py-2"><GraduationCap className="mr-2 h-4 w-4" />Degree</TabsTrigger>
              <TabsTrigger value="career" className="py-2"><BarChart className="mr-2 h-4 w-4" />Career</TabsTrigger>
              <TabsTrigger value="colleges" className="py-2"><MapPin className="mr-2 h-4 w-4" />Colleges</TabsTrigger>
              <TabsTrigger value="planner" className="py-2"><Bot className="mr-2 h-4 w-4" />Career Plan</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <Dashboard />
            </TabsContent>
            <TabsContent value="profiler">
              <InterestProfiler />
            </TabsContent>
            <TabsContent value="stream">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  <StreamSuggestion />
              </div>
            </TabsContent>
            <TabsContent value="degree">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  <DegreeCourseRecommendation />
              </div>
            </TabsContent>
            <TabsContent value="career">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  <CareerPathExploration />
              </div>
            </TabsContent>
            <TabsContent value="colleges">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  <CollegeLocator />
              </div>
            </TabsContent>
            <TabsContent value="planner">
              <CareerPlanGenerator />
            </TabsContent>
          </Tabs>
        </div>

        <DialogTrigger asChild>
            <Button
              className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-2xl z-50"
              size="icon"
            >
              <Bot className="h-8 w-8" />
              <span className="sr-only">Open AI Chatbot</span>
            </Button>
        </DialogTrigger>

      </main>
      
      <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-0">
              <DialogTitle>AI Assistant</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-hidden px-6 pb-6">
              <Chatbot />
          </div>
      </DialogContent>
    </Dialog>
  );
}
