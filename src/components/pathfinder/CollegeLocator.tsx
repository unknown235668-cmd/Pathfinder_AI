
"use client";

import { useState, useRef, useCallback } from "react";
import { searchCollegesLive, type CollegeSearchOutput } from "@/ai/flows/find-nearby-colleges";
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

type College = CollegeSearchOutput["colleges"][0];
type OwnershipFilter = "government" | "private" | "All";

const categories = [
  "Engineering","Medical","Law","Fashion","Polytechnic",
  "Arts","Science","Commerce","Agriculture","Pharmacy","Teacher-Training","Vocational"
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
  const [colleges, setColleges] = useState<College[]>([]);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<string>();
  const [category, setCategory] = useState<string>();
  const [ownership, setOwnership] = useState<OwnershipFilter>("All");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const loaderRef = useRef<HTMLDivElement>(null);

  const fetchColleges = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await searchCollegesLive({ query, state, category, ownership });
      if (!res.colleges.length) {
        setError("No institutions found.");
        setColleges([]);
      } else {
        setColleges(res.colleges);
      }
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Error", description: "Live search failed." });
      setError("Failed to fetch colleges.");
    } finally {
      setLoading(false);
    }
  }, [query, state, category, ownership, toast]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchColleges();
  };

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-accent" /> Institution Locator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Search live for all government and private institutions across India. No database needed.
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

            <Input type="text" placeholder="Search by name, city..." value={query} onChange={e => setQuery(e.target.value)} />
            
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
              <Search className="h-4 w-4 mr-2" /> {loading ? "Searching..." : "AI Search"}
            </Button>
          </div>
        </form>

        {error && (
          <div className="flex items-start gap-2 text-destructive p-3 bg-destructive/10 rounded-lg">
            <AlertTriangle className="h-5 w-5 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {loading && (
          <div className="space-y-3 pt-4">
            <Skeleton className="w-full h-24 rounded-lg" />
            <Skeleton className="w-full h-24 rounded-lg" />
          </div>
        )}

        {colleges.length > 0 && (
          <div className="space-y-3 pt-4">
            <p className="text-sm font-semibold text-muted-foreground">
              Showing {colleges.length} institutions loaded so far.
            </p>

            {colleges.map(college => (
              <div key={college.id} className="flex items-start gap-3 p-3">
                  <University className="h-5 w-5 text-primary shrink-0 mt-1"/>
                  <div className="flex-grow">
                    <a href={college.website} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
                      {college.name}
                    </a>
                    <p className="text-sm text-muted-foreground">{college.address}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className={cn(college.ownership==='private'?"border-accent text-accent":"")}>
                        {college.ownership.charAt(0).toUpperCase()+college.ownership.slice(1)}
                      </Badge>
                      <Badge variant="secondary">Type: {college.type}</Badge>
                      <Badge variant="secondary">Category: {college.category}</Badge>
                      <Badge variant="outline">Approval: {college.approval_body}</Badge>
                    </div>
                  </div>
                </div>
            ))}
          </div>
        )}
      </CardContent>
    </GlassCard>
  );
}
