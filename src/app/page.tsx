import { Header } from "@/components/pathfinder/Header";
import { InterestProfiler } from "@/components/pathfinder/InterestProfiler";
import { StreamSuggestion } from "@/components/pathfinder/StreamSuggestion";
import { DegreeCourseRecommendation } from "@/components/pathfinder/DegreeCourseRecommendation";
import { CareerPathExploration } from "@/components/pathfinder/CareerPathExploration";
import { CollegeLocator } from "@/components/pathfinder/CollegeLocator";

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-background via-background to-secondary/30">
      <Header />
      <div className="px-4 md:px-8 pb-16">
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="lg:col-span-2">
            <InterestProfiler />
          </div>
          <StreamSuggestion />
          <DegreeCourseRecommendation />
          <CareerPathExploration />
          <CollegeLocator />
        </div>
      </div>
    </main>
  );
}
