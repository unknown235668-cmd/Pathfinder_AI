"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, University, AlertTriangle, Building } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { searchCollegesLive, type CollegeSearchOutput } from "@/ai/flows/find-nearby-colleges";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type College = CollegeSearchOutput["colleges"][0];
type OwnershipFilter = "government" | "private" | "All";

const indianStates = ["Andhra Pradesh", "Delhi", "Maharashtra", "Karnataka"]; // short list
const ITEMS_PER_PAGE = 6;

export function CollegeLocator() {
  const [state, setState] = useState<string | undefined>();
  const [ownership, setOwnership] = useState<OwnershipFilter>("All");
  const [colleges, setColleges] = useState<College[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchColleges = async (reset = false) => {
    if (!state) {
      setError("Please select a state.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await searchCollegesLive({
        state,
        ownership,
        pageToken: reset ? undefined : nextPageToken,
      });

      if (reset) setColleges(response.colleges);
      else setColleges(prev => [...prev, ...response.colleges]);

      setNextPageToken(response.nextPageToken);

      if (response.colleges.length === 0 && reset) {
        setError("No institutions found for this state.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch colleges.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-accent" /> Institution Locator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <select onChange={e => setState(e.target.value)} className="border p-1 rounded">
            <option value="">Select State</option>
            {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select onChange={e => setOwnership(e.target.value as OwnershipFilter)} className="border p-1 rounded">
            <option value="All">All</option>
            <option value="government">Government</option>
            <option value="private">Private</option>
          </select>

          <Button onClick={() => fetchColleges(true)} disabled={loading}>
            {loading ? "Loading..." : "Search"}
          </Button>
        </div>

        {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle /> {error}</div>}

        <div className="space-y-3 pt-4">
          {colleges.map(c => (
            <div key={c.id} className="flex items-start gap-3 p-3 rounded-md bg-black/10 dark:bg-white/5">
              <University className="h-5 w-5 text-primary shrink-0 mt-1" />
              <div className="flex-grow">
                <a href={c.website} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">{c.name}</a>
                <p className="text-sm text-muted-foreground">{c.address}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className={cn(c.ownership === "private" && "border-accent text-accent")}>{c.ownership}</Badge>
                  <Badge variant="secondary">Type: {c.type}</Badge>
                  <Badge variant="secondary">Category: {c.category}</Badge>
                  <Badge variant="outline">Approval: {c.approval_body}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>

        {nextPageToken && (
          <Button onClick={() => fetchColleges(false)} className="mt-4 w-full">
            Load More
          </Button>
        )}
      </CardContent>
    </GlassCard>
  );
}
