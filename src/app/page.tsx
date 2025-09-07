/**
 * Copyright 2025 Pathfinder AI Contributors
 *
 * Licensed under the MIT License or Apache 2.0 License.
 * See LICENSE-MIT or LICENSE-APACHE for details.
 */

'use client';

import { Header } from "@/components/pathfinder/Header";
import { InterestProfiler } from "@/components/pathfinder/InterestProfiler";
import { StreamSuggestion } from "@/components/pathfinder/StreamSuggestion";
import { DegreeCourseRecommendation } from "@/components/pathfinder/DegreeCourseRecommendation";
import { CareerPathExploration } from "@/components/pathfinder/CareerPathExploration";
import { CollegeLocator } from "@/components/pathfinder/CollegeLocator";
import { CareerPlanGenerator } from "@/components/pathfinder/CareerPlanGenerator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Compass, GraduationCap, Lightbulb, MapPin, Search, Bot } from "lucide-react";
import { Dashboard } from "@/components/pathfinder/Dashboard";

export default function Home() {
  return (
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
                <CollegeLocator />
            </TabsContent>
            <TabsContent value="planner">
              <CareerPlanGenerator />
            </TabsContent>
          </Tabs>
        </div>
      </main>
  );
}

    
