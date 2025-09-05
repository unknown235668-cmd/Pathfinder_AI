
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, University, AlertTriangle, Search } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { Skeleton } from "../ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Input } from "../ui/input";
import colleges from "@/data/colleges.json";

interface College {
  id: number;
  name: string;
  type: string;
  state: string;
  city: string;
  address: string;
  website: string;
  approval_body: string;
}

export function CollegeLocator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<College[] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handleSearch = () => {
    setLoading(true);
    setError(null);
    setResult(null);

    if (!searchTerm.trim()) {
      setError("Please enter a city, state, or college name.");
      setLoading(false);
      return;
    }

    // Simulate network delay for a better user experience
    setTimeout(() => {
      try {
        const searchLower = searchTerm.toLowerCase();
        const filteredColleges = colleges.filter(college => 
          college.name.toLowerCase().includes(searchLower) ||
          college.city.toLowerCase().includes(searchLower) ||
          college.state.toLowerCase().includes(searchLower)
        );

        if (filteredColleges.length === 0) {
          setError(`No government colleges found matching "${searchTerm}". Please try a different search term.`);
        } else {
          setResult(filteredColleges);
        }
      } catch (e) {
        console.error(e);
        setError("Failed to load college data. Please try again later.");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load the list of colleges.",
        });
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms delay
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-accent" />
          Government College Locator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Search for government colleges by name, city, or state from our sample dataset.
        </p>

        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="e.g., Delhi, IIT, or Mumbai"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit" variant="secondary" disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            {loading ? "Searching..." : "Search"}
          </Button>
        </form>

        {error && (
          <div className="flex items-start gap-2 text-destructive p-3 bg-destructive/10 rounded-lg">
            <AlertTriangle className="h-5 w-5 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {loading && <Skeleton className="w-full h-48 rounded-lg" />}

        {result && !loading && (
          <div className="pt-4">
            <div className="space-y-3">
              {result.map((college) => (
                <div key={college.id} className="flex items-start gap-3 p-3 rounded-md bg-white/5">
                  <University className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div className="flex-grow">
                    <a href={college.website} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
                      {college.name}
                    </a>
                    <p className="text-xs text-muted-foreground">{college.address}</p>
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
