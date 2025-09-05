
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

  const handleSearch = async (latitude?: number, longitude?: number) => {
    setLoading(true);
    setError(null);
    setResult(null);

    if (!latitude && !manualLocation) {
        setError("Please enter a location or use the 'Find Colleges Near Me' button.");
        setLoading(false);
        return;
    }

    try {
        const res = await findNearbyColleges({
            latitude,
            longitude,
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

  const handleFindColleges = () => {
    setManualLocation(""); // Clear manual input for geolocation search
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleSearch(position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        switch(err.code) {
          case err.PERMISSION_DENIED:
            setError("Location permission denied. Please enable it in your browser settings for this site to use this feature.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location information is unavailable. Please check your device's location services or try entering your location manually.");
            break;
          case err.TIMEOUT:
            setError("The request to get user location timed out. Please try again or enter your location manually.");
            break;
          default:
            setError("An unknown error occurred while trying to get your location. Please try entering it manually.");
            break;
        }
      }
    );
  };
  
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
          Enter a city to find plausible government colleges, or use your current location.
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
        
        <div className="flex items-center gap-4">
            <div className="flex-grow border-t border-border"></div>
            <span className="text-xs text-muted-foreground">OR</span>
            <div className="flex-grow border-t border-border"></div>
        </div>

        <Button onClick={handleFindColleges} disabled={loading}>
          {loading ? "Searching..." : "Find Colleges Near Me"}
        </Button>

        {error && (
          <div className="flex items-start gap-2 text-destructive p-3 bg-destructive/10 rounded-lg">
            <AlertTriangle className="h-5 w-5 mt-0.5"/>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {loading && <Skeleton className="w-full h-48 rounded-lg" />}

        {result && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="relative aspect-video rounded-lg overflow-hidden">
                <Image 
                    src="https://picsum.photos/600/400" 
                    alt="Map view" 
                    fill
                    className="object-cover"
                    data-ai-hint="map satellite"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <p className="absolute bottom-2 left-2 text-white text-xs font-semibold">Map view is for demonstration only.</p>
            </div>
            <div className="space-y-3">
              {result.colleges.map((college, index) => (
                <div key={index} className="flex items-center gap-3">
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
