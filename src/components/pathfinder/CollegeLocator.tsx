
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
type FilterType = "government" | "private" | "All";

// Define the list of categories for the dropdown.
const categories = [
    "Engineering", "Medical", "Law", "Fashion", "Polytechnic", 
    "Arts", "Science", "Commerce", "Agriculture", "Pharmacy", "Teacher-Training", "Vocational"
];

// Define the list of Indian states and UTs for the filter dropdown.
const indianStates = [
    "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
    "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
    "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", 
    "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", 
    "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const ITEMS_PER_PAGE = 20;

export function CollegeLocator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<College[] | null>(null);
  const [city, setCity] = useState("");
  const [state, setState] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<FilterType>("government");
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);

  // Function to handle state dropdown selection
  const handleStateSelect = (selectedState: string) => {
    const newState = selectedState === "all" ? undefined : selectedState;
    setState(newState);
  };
  
  const handleSearch = async (
    filters: { state?: string; city?: string; category?: string; typeFilter: FilterType }
  ) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setCurrentPage(1); // Reset to first page on new search
    
    try {
      const response = await findNearbyColleges(filters);
      
      if (!response || response.colleges.length === 0) {
        let errorMessage = `No institutions found`;
        if (filters.typeFilter !== 'All') errorMessage = `No ${filters.typeFilter} institutions found`;
        if (filters.state) errorMessage += ` in "${filters.state}"`;
        if (filters.city) errorMessage += ` for query "${filters.city}"`;
        if (filters.category) errorMessage += ` in the "${filters.category}" category`;
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
    handleSearch({ state, city, category, typeFilter });
  };

  // Pagination logic to display results in chunks without truncating the full list.
  const paginatedResults = result ? result.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE) : [];
  const totalPages = result ? Math.ceil(result.length / ITEMS_PER_PAGE) : 0;

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
          Select a state or search by name, city, or state to find government or private institutions across India.
        </p>
        
        {/* Search Form */}
        <form onSubmit={handleFormSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {/* State Selection Dropdown */}
            <Select onValueChange={handleStateSelect} value={state}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a State" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {indianStates.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Universal Search Input */}
            <Input
              type="text"
              placeholder="Or search by name, city, alias..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="flex-grow"
            />
            
            {/* Category Dropdown */}
            <Select onValueChange={(value) => setCategory(value === "all" ? undefined : value)}>
                <SelectTrigger>
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
            {/* Government/Private Toggle Buttons */}
            <div className="grid grid-cols-3 gap-2 flex-grow">
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
                <Button 
                    type="button"
                    variant={typeFilter === 'All' ? 'secondary' : 'outline'}
                    onClick={() => setTypeFilter('All')}
                    className="w-full"
                >
                    <Building className="mr-2 h-4 w-4"/>
                    All
                </Button>
            </div>
            {/* Search Button */}
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
          <div className="pt-4 space-y-4">
             <p className="text-sm font-semibold text-muted-foreground">Showing {paginatedResults.length} of {result.length} institutions.</p>
            <div className="space-y-3">
              {paginatedResults.map((college) => (
                <div key={college.id} className="flex items-start gap-3 p-3 rounded-md bg-black/10 dark:bg-white/5 transition-colors hover:bg-black/20 dark:hover:bg-white/10">
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
              ))}
            </div>
            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}
          </div>
        )}
      </CardContent>
    </GlassCard>
  );
}
