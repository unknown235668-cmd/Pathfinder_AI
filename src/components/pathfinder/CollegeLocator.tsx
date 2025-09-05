"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  "Engineering","Medical","Law","Fashion","Polytechnic",
  "Arts","Science","Commerce","Agriculture","Pharmacy","Teacher-Training","Vocational"
];

const indianStates = [
  "Andaman and Nicobar Islands","Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chandigarh",
  "Chhattisgarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jammu and Kashmir","Jharkhand","Karnataka","Kerala","Ladakh","Lakshadweep",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Puducherry",
  "Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"
];

export function CollegeLocator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [colleges, setColleges] = useState<College[]>([]);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [ownership, setOwnership] = useState<OwnershipFilter>("All");
  const [pageToken, setPageToken] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const isFetching = useRef(false);
  const currentSearchId = useRef(0);

  const handleStateSelect = (selectedState: string) => setState(selectedState === "all" ? undefined : selectedState);

  const fetchNextPage = useCallback(async (searchId: number) => {
    if (isFetching.current || !hasMore) return;

    isFetching.current = true;
    setLoading(true);
    try {
      const response = await searchCollegesLive({ query, state, category, ownership, pageToken });
      
      // If the search ID has changed, it means the user started a new search, so we discard the results of the old one.
      if (searchId !== currentSearchId.current) return;

      if (response.colleges.length > 0) {
        setColleges(prev => {
          const existingIds = new Set(prev.map(c => `${c.name}-${c.address}`));
          const newColleges = response.colleges.filter(c => !existingIds.has(`${c.name}-${c.address}`));
          return [...prev, ...newColleges];
        });
      }
      if (response.nextPageToken) {
        setPageToken(response.nextPageToken);
      } else {
        setHasMore(false);
      }
    } catch (e: any) {
      console.error(e);
      setError("Failed to fetch institutions.");
      toast({ variant: "destructive", title: "Error", description: "Could not perform live search. Please try again." });
      setHasMore(false);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [hasMore, pageToken, query, state, category, ownership, toast]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state) {
      toast({ variant: "destructive", title: "Select a state", description: "Please choose a state to start the search." });
      return;
    }
    
    // Increment searchId to invalidate previous searches
    currentSearchId.current += 1;
    const searchId = currentSearchId.current;
    
    setColleges([]);
    setPageToken(undefined);
    setHasMore(true);
    setError(null);

    // Use a timeout to ensure state updates are processed before fetching
    setTimeout(() => fetchNextPage(searchId), 0);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      // Trigger fetch only when the loader is intersecting and we are not already fetching
      if (entries[0].isIntersecting && !isFetching.current) {
        fetchNextPage(currentSearchId.current);
      }
    }, { threshold: 1 });

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [fetchNextPage]);

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-accent" />
          Institution Locator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">AI-powered live search for all colleges in the selected state. Scroll down to load more results.</p>

        <form onSubmit={handleFormSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Select onValueChange={handleStateSelect} value={state}>
              <SelectTrigger><SelectValue placeholder="* Select a State" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {indianStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>

            <Input type="text" placeholder="Filter by name, city, alias..." value={query} onChange={e => setQuery(e.target.value)} className="flex-grow" />

            <Select onValueChange={value => setCategory(value === "all" ? undefined : value)}>
              <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="grid grid-cols-3 gap-2 flex-grow">
              {(["government","private","All"] as OwnershipFilter[]).map(o => (
                <Button key={o} type="button" variant={ownership === o ? "secondary" : "outline"} onClick={() => setOwnership(o)} className="w-full">
                  <Building className="mr-2 h-4 w-4" /> {o.charAt(0).toUpperCase() + o.slice(1)}
                </Button>
              ))}
            </div>
            <Button type="submit" variant="default" className="w-full sm:w-auto">
              <Search className="h-4 w-4 mr-2" />
              AI Search
            </Button>
          </div>
        </form>

        {error && (
          <div className="flex items-start gap-2 text-destructive p-3 bg-destructive/10 rounded-lg">
            <AlertTriangle className="h-5 w-5 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-3 pt-4">
          {colleges.length > 0 && (
            <p className="text-sm font-semibold text-muted-foreground">
              Showing {colleges.length} institutions loaded so far.
            </p>
          )}

          {colleges.map(college => (
            <div key={`${college.name}-${college.address}`} className="flex items-start gap-3 p-3 rounded-md bg-black/10 dark:bg-white/5 transition-colors hover:bg-black/20 dark:hover:bg-white/10">
              <University className="h-5 w-5 text-primary shrink-0 mt-1" />
              <div className="flex-grow">
                <a href={college.website} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">{college.name}</a>
                <p className="text-sm text-muted-foreground">{college.address}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className={cn(college.ownership.toLowerCase() === "private" && "border-accent text-accent")}>{college.ownership.charAt(0).toUpperCase() + college.ownership.slice(1)}</Badge>
                  <Badge variant="secondary">Type: {college.type}</Badge>
                  <Badge variant="secondary">Category: {college.category}</Badge>
                  <Badge variant="outline">Approval: {college.approval_body}</Badge>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="space-y-3 pt-2">
              <Skeleton className="w-full h-24 rounded-lg" />
              <Skeleton className="w-full h-24 rounded-lg" />
            </div>
          )}
          
          {!hasMore && colleges.length > 0 &&
            <p className="text-center text-sm text-muted-foreground py-4">End of results.</p>
          }
          
          <div ref={loaderRef} />
        </div>
      </CardContent>
    </GlassCard>
  );
}
