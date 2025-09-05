
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, University, AlertTriangle, Search, Building } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { Skeleton } from "../ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { findNearbyColleges, type FindNearbyCollegesOutput } from "@/ai/flows/find-nearby-colleges";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Define the type for a single college based on the AI flow's output.
type College = FindNearbyCollegesOutput["colleges"][0];
type FilterType = "government" | "private";

// Define the list of categories for the dropdown.
const categories = [
    "Engineering", "Medical", "Law", "Fashion", "Polytechnic", 
    "Arts", "Science", "Commerce", "Agriculture", "Pharmacy", "Teacher-Training", "Management"
];

export function CollegeLocator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<College[] | null>(null);
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<FilterType>("government");
  const { toast } = useToast();

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Call the AI flow with the location, category, and type filter.
      const response = await findNearbyColleges({ location, category, typeFilter });
      
      if (!response || response.colleges.length === 0) {
        let errorMessage = `No ${typeFilter} institutions found`;
        if (location) errorMessage += ` for "${location}"`;
        if (category) errorMessage += ` in the "${category}" category`;
        setError(errorMessage + ". Please try a different search.");
      } else {
        setResult(response.colleges);
      }
    } catch (e: any) {
      console.error(e);
      const errorMessage = e.message || "An unexpected error occurred.";
      setError(`Failed to find institutions. ${errorMessage}`);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not find institutions. Please try again.",
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
          Institution Locator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Search for government or private colleges, universities, and institutes across India.
        </p>

        {/* Search Form */}
        <form onSubmit={handleFormSubmit} className="space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-2">
            <Input
              type="text"
              placeholder="e.g., Delhi, Mumbai, or leave blank"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-grow"
            />
            <Select onValueChange={(value) => setCategory(value === "all" ? undefined : value)}>
                <SelectTrigger className="w-full md:w-[220px]">
                    <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
           <div className="flex flex-col sm:flex-row gap-2">
            <div className="grid grid-cols-2 gap-2 flex-grow">
                 <Button 
                    type="button"
                    variant={typeFilter === 'government' ? 'secondary' : 'outline'}
                    onClick={() => setTypeFilter('government')}
                    className="w-full"
                >
                    <Building className="mr-2 h-4 w-4"/>
                    Government
                </Button>
                <Button 
                    type="button"
                    variant={typeFilter === 'private' ? 'secondary' : 'outline'}
                    onClick={() => setTypeFilter('private')}
                    className="w-full"
                >
                    <Building className="mr-2 h-4 w-4"/>
                    Private
                </Button>
            </div>
            <Button type="submit" variant="default" disabled={loading} className="w-full sm:w-auto">
              <Search className="h-4 w-4 mr-2" />
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </form>

        {/* Error Display */}
        {error && (
          <div className="flex items-start gap-2 text-destructive p-3 bg-destructive/10 rounded-lg">
            <AlertTriangle className="h-5 w-5 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
            <div className="space-y-3 pt-4">
                <Skeleton className="w-full h-24 rounded-lg" />
                <Skeleton className="w-full h-24 rounded-lg" />
                <Skeleton className="w-full h-24 rounded-lg" />
            </div>
        )}

        {/* Results Display */}
        {result && !loading && (
          <div className="pt-4">
            <div className="space-y-3">
              {result.map((college) => (
                <div key={college.id} className="flex items-start gap-3 p-3 rounded-md bg-black/10 dark:bg-white/5 transition-colors hover:bg-black/20 dark:hover:bg-white/10">
                  <University className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div className="flex-grow">
                    <a href={college.website} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
                      {college.name}
                    </a>
                    <p className="text-sm text-muted-foreground">{college.address}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className={cn(college.ownership === 'private' && "border-accent text-accent")}>
                           {college.ownership.charAt(0).toUpperCase() + college.ownership.slice(1)}
                        </Badge>
                        <Badge variant="secondary">Type: {college.type}</Badge>
                        <Badge variant="secondary">Category: {college.category}</Badge>
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
