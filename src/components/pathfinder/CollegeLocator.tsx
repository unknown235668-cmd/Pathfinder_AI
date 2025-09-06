/**
 * Copyright 2025 Pathfinder AI Contributors
 *
 * Licensed under the MIT or Apache 2.0 License.
 * See LICENSE-MIT or LICENSE-APACHE for details.
 */

"use client";

import { useState, useRef, useCallback } from "react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, University, AlertTriangle, Search, Building, FileDown, Loader2 } from "lucide-react";
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
  "Engineering","Medical","Management", "Law","Arts","Science","Commerce","Pharmacy",
  "Agriculture","Fashion","Architecture","Polytechnic"
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
  const [exporting, setExporting] = useState(false);
  const [colleges, setColleges] = useState<College[]>([]);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<string>();
  const [category, setCategory] = useState<string>();
  const [ownership, setOwnership] = useState<OwnershipFilter>("government");
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
  
  const handleExportPdf = () => {
    if (colleges.length === 0) return;

    setExporting(true);
    try {
      const doc = new jsPDF();
      let yPos = 15;
      const pageHeight = doc.internal.pageSize.height;
      const leftMargin = 15;
      const rightMargin = 195;
      const lineHeight = 7;
      const titleLineHeight = 10;
      
      const addPageIfNeeded = () => {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = 15;
        }
      };
      
      doc.setFontSize(16);
      doc.text("College Search Results", doc.internal.pageSize.width / 2, yPos, { align: 'center' });
      yPos += titleLineHeight * 2;

      colleges.forEach((college) => {
        addPageIfNeeded();
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        const splitName = doc.splitTextToSize(college.name, rightMargin - leftMargin);
        doc.text(splitName, leftMargin, yPos);
        yPos += splitName.length * lineHeight;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');

        const location = `${college.city}, ${college.state}`;
        doc.text(location, leftMargin, yPos);
        yPos += lineHeight;
        
        if (college.website) {
            doc.setTextColor(0, 0, 255); // Blue for links
            doc.textWithLink(college.website, leftMargin, yPos, { url: college.website });
            doc.setTextColor(0, 0, 0); // Reset color
            yPos += lineHeight;
        }
        
        const details = `Ownership: ${college.ownership} | Category: ${college.category} | Approved by: ${college.approval_body}`;
        doc.text(details, leftMargin, yPos);
        yPos += lineHeight;

        doc.setLineWidth(0.2);
        doc.line(leftMargin, yPos, rightMargin, yPos);
        yPos += lineHeight;
      });

      doc.save(`College-List-${query || state || 'export'}.pdf`);
    } catch (error) {
        console.error("Failed to export PDF:", error);
        toast({
            variant: "destructive",
            title: "Export Failed",
            description: "An error occurred while exporting the college list to PDF.",
        });
    } finally {
        setExporting(false);
    }
  };

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-accent" /> Institution Database Locator
            </div>
            {colleges.length > 0 && (
                <Button onClick={handleExportPdf} variant="outline" size="sm" disabled={exporting}>
                    {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileDown className="mr-2 h-4 w-4" />}
                    Export PDF
                </Button>
            )}
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
                 <Button type="button" variant={ownership === "government" ? "secondary" : "outline"} onClick={() => setOwnership("government")} className="w-full">
                  <Building className="mr-2 h-4 w-4" /> Government
                </Button>
                 <Button type="button" variant={ownership === "private" ? "secondary" : "outline"} onClick={() => setOwnership("private")} className="w-full">
                  <Building className="mr-2 h-4 w-4" /> Private
                </Button>
                 <Button type="button" variant={ownership === "All" ? "secondary" : "outline"} onClick={() => setOwnership("All")} className="w-full">
                  <Building className="mr-2 h-4 w-4" /> All
                </Button>
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

        <div className="space-y-3 pt-4 bg-background">
          {colleges.map((college, index) => (
            <div ref={index === colleges.length - 1 ? lastCollegeRef : null} key={`${college.id}-${index}`}>
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
        <p className="text-sm text-muted-foreground">{college.city}, {college.state}</p>
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
