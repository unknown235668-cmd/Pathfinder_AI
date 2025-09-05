"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, University, AlertTriangle, Search, Building } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { Skeleton } from "../ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { searchCollegesLive, type CollegeSearchOutput } from "@/ai/flows/find-nearby-colleges";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type College = CollegeSearchOutput["colleges"][0];
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
  const [result, setResult] = useState<College[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<string>();
  const [category, setCategory] = useState<string>();
  const [ownership, setOwnership] = useState<OwnershipFilter>("All");
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!state) {
      toast({ variant:"destructive", title:"Select a state first!" });
      return;
    }

    setLoading(true);
    setError(null);
    setResult([]);

    try {
      const results: College[] = [];
      for (const cat of (category ? [category] : categories)) {
        const response = await searchCollegesLive({ state, category: cat, ownership });
        results.push(...response.colleges);
      }

      // Deduplicate across categories
      const uniqueColleges = Array.from(
        new Map(results.map(c => [`${c.name}-${c.city}`, c])).values()
      );

      if (uniqueColleges.length === 0) setError("No institutions found for this state.");
      setResult(uniqueColleges);

    } catch (e: any) {
      console.error(e);
      setError("Failed to fetch colleges. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5"/>Institution Locator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Select onValueChange={setState}><SelectTrigger><SelectValue placeholder="Select State"/></SelectTrigger>
            <SelectContent>{indianStates.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>

          <Select onValueChange={v=>setCategory(v==="all"?undefined:v)}>
            <SelectTrigger><SelectValue placeholder="Category (optional)"/></SelectTrigger>
            <SelectContent><SelectItem value="all">All</SelectItem>{categories.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>

          <div className="grid grid-cols-3 gap-2">
            <Button variant={ownership==="government"?"secondary":"outline"} onClick={()=>setOwnership("government")}>Government</Button>
            <Button variant={ownership==="private"?"secondary":"outline"} onClick={()=>setOwnership("private")}>Private</Button>
            <Button variant={ownership==="All"?"secondary":"outline"} onClick={()=>setOwnership("All")}>All</Button>
          </div>
        </div>

        <Button onClick={handleSearch} disabled={loading} className="w-full sm:w-auto">
          <Search className="h-4 w-4 mr-2"/>{loading?"Searching...":"Fetch Colleges"}
        </Button>

        {loading && <Skeleton className="h-24 w-full rounded-lg"/>}

        {error && <div className="text-destructive">{error}</div>}

        {!loading && result.length>0 && (
          <div className="space-y-3">
            {result.map(college=>(
              <div key={college.id} className="p-3 bg-black/10 rounded-md flex flex-col md:flex-row gap-2">
                <University className="h-5 w-5 text-primary"/>
                <div>
                  <a href={college.website} target="_blank" className="font-semibold hover:underline">{college.name}</a>
                  <p className="text-sm">{college.address}</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <Badge variant="outline">{college.ownership}</Badge>
                    <Badge variant="secondary">Type: {college.type}</Badge>
                    <Badge variant="secondary">Category: {college.category}</Badge>
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