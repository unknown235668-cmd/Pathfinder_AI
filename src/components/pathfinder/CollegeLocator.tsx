
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, University, AlertTriangle, Search, Building } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { Skeleton } from "../ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { searchCollegesLive, type CollegeSearchOutput } from "@/ai/flows/find-nearby-colleges";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type College = CollegeSearchOutput["colleges"][0];
type OwnershipFilter = "government" | "private" | "All";

const categories = [
  "Engineering", "Medical", "Law", "Fashion", "Polytechnic",
  "Arts", "Science", "Commerce", "Agriculture", "Pharmacy",
  "Teacher-Training", "Vocational"
];

const indianStates = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

export function CollegeLocator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [colleges, setColleges] = useState<College[]>([]);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [ownership, setOwnership] = useState<OwnershipFilter>("All");
  const { toast } = useToast();

  const observer = useRef<IntersectionObserver>();
  const lastCollegeRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          fetchColleges();
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading]
  );

  const [fetchedOnce, setFetchedOnce] = useState(false);

  const fetchColleges = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await searchCollegesLive({ state, ownership, category, query });
      if (!response.colleges || response.colleges.length === 0) {
        if (!fetchedOnce) setError("No institutions found for your criteria.");
      } else {
        setColleges(prev => {
          const unique = Array.from(new Map([...prev, ...response.colleges].map(c => [`${c.name}-${c.city}`, c])).values());
          return unique;
        });
      }
      setFetchedOnce(true);
    } catch (e: any) {
      console.error(e);
      setError("Failed to fetch colleges. Please try again.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not perform live search.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setColleges([]);
    setFetchedOnce(false);
    fetchColleges();
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
          Use AI to search all government/private institutions across India. Infinite scroll enabled. No DB needed.
        </p>

        <form onSubmit={handleFormSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Select onValueChange={val => setState(val === "all" ? undefined : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {indianStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>

            <Input
              type="text"
              placeholder="Search by name, city, alias..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />

            <Select onValueChange={val => setCategory(val === "all" ? undefined : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="grid grid-cols-3 gap-2 flex-grow">
              {["government", "private", "All"].map(type => (
                <Button
                  key={type}
                  variant={ownership === type ? "secondary" : "outline"}
                  onClick={() => setOwnership(type as OwnershipFilter)}
                  className="w-full"
                >
                  <Building className="mr-2 h-4 w-4" />
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
            <Button type="submit" variant="default" disabled={loading} className="w-full sm:w-auto">
              <Search className="h-4 w-4 mr-2" />
              {loading ? "Searching..." : "AI Search"}
            </Button>
          </div>
        </form>

        {error && (
          <div className="flex items-start gap-2 text-destructive p-3 bg-destructive/10 rounded-lg">
            <AlertTriangle className="h-5 w-5 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4 pt-4">
          {colleges.map((college, i) => {
            if (i === colleges.length - 1) {
              return (
                <div ref={lastCollegeRef} key={college.id} className="college-card">
                  <CollegeCard college={college} />
                </div>
              );
            }
            return <CollegeCard key={college.id} college={college} />;
          })}

          {loading && (
            <div className="space-y-3 pt-4">
              <Skeleton className="w-full h-24 rounded-lg" />
              <Skeleton className="w-full h-24 rounded-lg" />
              <Skeleton className="w-full h-24 rounded-lg" />
            </div>
          )}
        </div>
      </CardContent>
    </GlassCard>
  );
}

function CollegeCard({ college }: { college: College }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-md bg-black/10 dark:bg-white/5 transition-colors hover:bg-black/20 dark:hover:bg-white/10">
      <University className="h-5 w-5 text-primary shrink-0 mt-1" />
      <div className="flex-grow">
        <a href={college.website} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
          {college.name}
        </a>
        <p className="text-sm text-muted-foreground">{college.address}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline" className={cn(college.ownership.toLowerCase() === 'private' && "border-accent text-accent")}>
            {college.ownership.charAt(0).toUpperCase() + college.ownership.slice(1)}
          </Badge>
          <Badge variant="secondary">Type: {college.type}</Badge>
          <Badge variant="secondary">Category: {college.category}</Badge>
          <Badge variant="outline">Approval: {college.approval_body}</Badge>
        </div>
      </div>
    </div>
  );
}
