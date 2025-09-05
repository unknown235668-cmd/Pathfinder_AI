
"use client";

import { useState } from "react";
import Image from "next/image";
import { findNearbyColleges, type FindNearbyCollegesOutput } from "@/ai/flows/find-nearby-colleges";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, University, AlertTriangle, Search } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { Skeleton } from "../ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Input } from "../ui/input";

export function CollegeLocator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FindNearbyCollegesOutput | null>(null);
  const [manualLocation, setManualLocation] = useState("");
  const { toast } = useToast();

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    if (!manualLocation) {
        setError("Please enter a location.");
        setLoading(false);
        return;
    }

    try {
        const res = await findNearbyColleges({
            location: manualLocation,
        });
        setResult(res);
    } catch (e) {
        console.error(e);
        setError("The AI failed to find colleges. This could be due to a network issue or an API key problem. Please try again later.");
        toast({
            variant: "destructive",
            title: "AI Error",
            description: "The AI failed to generate colleges for your location.",
        });
    } finally {
        setLoading(false);
    }
  }
  
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  }


  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-accent" />
          Nearby Government College Locator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Enter a city to find plausible government colleges.
        </p>

        <form onSubmit={handleManualSearch} className="flex items-center gap-2">
            <Input 
                type="text"
                placeholder="Enter your city or region..."
                value={manualLocation}
                onChange={(e) => setManualLocation(e.target.value)}
                className="flex-grow"
            />
            <Button type="submit" variant="secondary" disabled={loading || !manualLocation}>
                <Search className="h-4 w-4 mr-2"/>
                Search
            </Button>
        </form>

        {error && (
          <div className="flex items-start gap-2 text-destructive p-3 bg-destructive/10 rounded-lg">
            <AlertTriangle className="h-5 w-5 mt-0.5"/>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {loading && <Skeleton className="w-full h-48 rounded-lg" />}

        {result && !loading && (
          <div className="pt-4">
            <div className="space-y-3">
              {result.colleges.map((college, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-md bg-white/5">
                  <University className="h-5 w-5 text-primary shrink-0"/>
                  <div>
                    <p className="font-semibold">{college.name}</p>
                    <p className="text-xs text-muted-foreground">{college.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </GlassCard>
  );
}
