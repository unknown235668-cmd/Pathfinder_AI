
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, University, AlertTriangle, Search } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { Skeleton } from "../ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { findNearbyColleges, type FindNearbyCollegesOutput } from "@/ai/flows/find-nearby-colleges";

// Define the type for a single college based on the AI flow's output.
type College = FindNearbyCollegesOutput["colleges"][0];

// Define the list of categories for the dropdown.
const categories = [
    "Engineering", "Medical", "Law", "Fashion", "Polytechnic", 
    "Arts", "Science", "Commerce", "Agriculture", "Pharmacy", "Teacher-Training"
];

export function CollegeLocator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<College[] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const { toast } = useToast();

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    // Validate that the search term is not empty.
    if (!searchTerm.trim()) {
      setError("Please enter a city, state, or college name.");
      setLoading(false);
      return;
    }
    
    try {
      // Call the AI flow with the location and the selected category.
      const response = await findNearbyColleges({ location: searchTerm, category });
      
      if (!response || response.colleges.length === 0) {
        let errorMessage = `No government colleges found matching "${searchTerm}"`;
        if (category) {
            errorMessage += ` in the "${category}" category`;
        }
        setError(errorMessage + ". Please try a different search term.");
      } else {
        setResult(response.colleges);
      }
    } catch (e: any) {
      console.error(e);
      const errorMessage = e.message || "An unexpected error occurred.";
      setError(`Failed to find colleges. ${errorMessage}`);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not find colleges. Please try again.",
      });
    } finally {
      setLoading(false);
    }
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
          Search for government colleges by location and filter by category.
        </p>

        {/* Search Form */}
        <form onSubmit={handleFormSubmit} className="flex flex-col md:flex-row items-center gap-2">
          <Input
            type="text"
            placeholder="e.g., Delhi, Mumbai, or Tiruchirappalli"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Select onValueChange={(value) => setCategory(value === "all" ? undefined : value)}>
              <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
              </SelectContent>
          </Select>
          <Button type="submit" variant="secondary" disabled={loading} className="w-full md:w-auto">
            <Search className="h-4 w-4 mr-2" />
            {loading ? "Searching..." : "Search"}
          </Button>
        </form>

        {/* Error Display */}
        {error && (
          <div className="flex items-start gap-2 text-destructive p-3 bg-destructive/10 rounded-lg">
            <AlertTriangle className="h-5 w-5 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && <Skeleton className="w-full h-48 rounded-lg" />}

        {/* Results Display */}
        {result && !loading && (
          <div className="pt-4">
            <div className="space-y-3">
              {result.map((college) => (
                <div key={college.id} className="flex items-start gap-3 p-3 rounded-md bg-white/5 transition-colors hover:bg-white/10">
                  <University className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div className="flex-grow">
                    <a href={college.website} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
                      {college.name}
                    </a>
                    <p className="text-sm text-muted-foreground">{college.address}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                        <Badge variant="outline">Type: {college.type}</Badge>
                        <Badge variant="outline">Category: {college.category}</Badge>
                        <Badge variant="outline">Approval: {college.approval_body}</Badge>
                    </div>
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
