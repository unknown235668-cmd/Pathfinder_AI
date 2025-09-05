"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, University, AlertTriangle } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { Skeleton } from "../ui/skeleton";

type College = {
  name: string;
  distance: string;
};

const mockColleges: College[] = [
  { name: 'Govt. College of Engineering & Tech', distance: '5 km' },
  { name: 'City Arts & Commerce College', distance: '8 km' },
  { name: 'State Science Institute', distance: '12 km' },
  { name: 'National Law College', distance: '15 km' },
];

export function CollegeLocator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [colleges, setColleges] = useState<College[]>([]);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  const handleFindColleges = () => {
    setLoading(true);
    setError(null);
    setColleges([]);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      setPermissionGranted(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // In a real app, you would use position.coords to query a college API.
        // Here we just simulate a successful fetch.
        setTimeout(() => {
          setColleges(mockColleges);
          setLoading(false);
          setPermissionGranted(true);
        }, 1500);
      },
      (err) => {
        setError("Location permission denied. Please enable it in your browser settings to use this feature.");
        setLoading(false);
        setPermissionGranted(false);
      }
    );
  };

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
          Find government colleges near you based on your location.
        </p>
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

        {permissionGranted && colleges.length > 0 && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              {colleges.map((college, index) => (
                <div key={index} className="flex items-center gap-3">
                  <University className="h-5 w-5 text-primary shrink-0"/>
                  <div>
                    <p className="font-semibold">{college.name}</p>
                    <p className="text-xs text-muted-foreground">{college.distance} away</p>
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
