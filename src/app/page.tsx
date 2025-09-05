import { Header } from "@/components/pathfinder/Header";
import { InterestProfiler } from "@/components/pathfinder/InterestProfiler";
import { StreamSuggestion } from "@/components/pathfinder/StreamSuggestion";
import { DegreeCourseRecommendation } from "@/components/pathfinder/DegreeCourseRecommendation";
import { CareerPathExploration } from "@/components/pathfinder/CareerPathExploration";
import { CollegeLocator } from "@/components/pathfinder/CollegeLocator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Compass, GraduationCap, Lightbulb, MapPin, Search } from "lucide-react";
import { GlassCard } from "@/components/pathfinder/GlassCard";

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-background via-background to-secondary/30">
      <Header />
      <div className="px-4 md:px-8 pb-16">
        <Tabs defaultValue="dashboard" className="mx-auto max-w-7xl">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-auto mb-8">
            <TabsTrigger value="dashboard" className="py-2"><Compass className="mr-2 h-4 w-4" />Dashboard</TabsTrigger>
            <TabsTrigger value="profiler" className="py-2"><Lightbulb className="mr-2 h-4 w-4" />Profiler</TabsTrigger>
            <TabsTrigger value="stream" className="py-2"><Search className="mr-2 h-4 w-4" />Stream</TabsTrigger>
            <TabsTrigger value="degree" className="py-2"><GraduationCap className="mr-2 h-4 w-4" />Degree</TabsTrigger>
            <TabsTrigger value="career" className="py-2"><BarChart className="mr-2 h-4 w-4" />Career</TabsTrigger>
            <TabsTrigger value="colleges" className="py-2"><MapPin className="mr-2 h-4 w-4" />Colleges</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <GlassCard>
                <CardHeader>
                    <CardTitle>Welcome to Pathfinder AI</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Your personal guide to a bright future. Select a tool from the tabs above to get started.</p>
                </CardContent>
            </GlassCard>
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
        </Tabs>
      </div>
    </main>
  );
}
