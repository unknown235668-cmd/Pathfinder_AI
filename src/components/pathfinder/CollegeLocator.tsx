"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, University, AlertTriangle, Search, Building } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { Skeleton } from "../ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DocumentData } from "firebase/firestore";

type College = DocumentData & {
  id: string;
  name: string;
  type: string;
  ownership: string;
  category: string;
  state: string;
  city: string;
  address: string;
  website?: string;
  approval_body: string;
};
type OwnershipFilter = "government" | "private" | "All";

const categories = [
  "Engineering","Medical","Law","Fashion","Polytechnic","Arts","Science","Commerce",
  "Agriculture","Pharmacy","Teacher-Training","Vocational"
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
  const [colleges, setColleges] = useState<College[]>([]);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<string>();
  const [category, setCategory] = useState<string>();
  const [ownership, setOwnership] = useState<OwnershipFilter>("All");
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const { toast } = useToast();
  const observer = useRef<IntersectionObserver>();
  
  const fetchColleges = useCallback(async (cursor: string | null, isNewSearch: boolean = false) => {
    if (loading && !isNewSearch) return;
    setLoading(true);
    if(isNewSearch) setError(null);

    try {
      const params = new URLSearchParams();
      if (state) params.append('state', state);
      if (category) params.append('category', category);
      if (ownership !== 'All') params.append('ownership', ownership);
      if (query) params.append('query', query);
      if (cursor) params.append('cursor', cursor);

      const res = await fetch(`/api/colleges/search?${params.toString()}`);
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch from API.');
      }

      setColleges(prev => isNewSearch ? data.colleges : [...prev, ...data.colleges]);
      setNextCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);

      if (data.colleges.length === 0 && isNewSearch) {
        setError("No institutions found for this combination of filters.");
      }

    } catch (e: any) {
      console.error(e);
      const errorMessage = e.message || "An unknown error occurred.";
      setError(`Failed to fetch colleges: ${errorMessage}`);
      toast({ variant: "destructive", title: "Error", description: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [state, category, ownership, query, toast, loading]);

  const lastCollegeRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore && nextCursor) {
          fetchColleges(nextCursor, false);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore, nextCursor, fetchColleges]
  );

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setColleges([]);
    setNextCursor(null);
    setHasMore(true);
    fetchColleges(null, true);
  };

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-accent" /> Institution Database Locator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Search our comprehensive database of Indian institutions. Use the filters and scroll down to load more results.
        </p>

        <form onSubmit={handleFormSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Select onValueChange={(v) => setState(v === "all" ? undefined : v)} value={state}>
              <SelectTrigger><SelectValue placeholder="Select a State" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {indianStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>

            <Input type="text" placeholder="Search by name..." value={query} onChange={e => setQuery(e.target.value)} />
            
            <Select onValueChange={(v) => setCategory(v === "all" ? undefined : v)} value={category}>
              <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="grid grid-cols-3 gap-2 flex-grow">
              {["government","private","All"].map(o => (
                <Button key={o} type="button" variant={ownership === o ? "secondary" : "outline"} onClick={() => setOwnership(o as OwnershipFilter)} className="w-full">
                  <Building className="mr-2 h-4 w-4" /> {o.charAt(0).toUpperCase() + o.slice(1)}
                </Button>
              ))}
            </div>
            <Button type="submit" variant="default" disabled={loading} className="w-full sm:w-auto">
              <Search className="h-4 w-4 mr-2" /> {loading ? "Searching..." : "Search"}
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
          {colleges.map((college, index) => (
            <div ref={index === colleges.length - 1 ? lastCollegeRef : null} key={college.id}>
              <CollegeCard college={college} />
            </div>
          ))}

          {loading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="w-full h-24 rounded-lg" />)}

          {!loading && !hasMore && colleges.length > 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">End of results.</p>
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
          <Badge variant="outline" className={cn(college.ownership?.toLowerCase() === "private" && "border-accent text-accent")}>
            {college.ownership}
          </Badge>
          <Badge variant="secondary">Type: {college.type}</Badge>
          <Badge variant="secondary">Category: {college.category}</Badge>
          <Badge variant="outline">Approval: {college.approval_body}</Badge>
        </div>
      </div>
    </div>
  )
}
