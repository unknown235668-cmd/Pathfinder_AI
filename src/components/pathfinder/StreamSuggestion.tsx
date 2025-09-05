"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { suggestStream, type SuggestStreamOutput } from "@/ai/flows/stream-suggestion-after-10";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { BookOpen } from "lucide-react";
import { GlassCard } from "./GlassCard";

const formSchema = z.object({
  interests: z.string().min(10, "Please describe your interests.").max(300),
  academicPerformance: z.string().min(10, "Please describe your performance.").max(300),
});

export function StreamSuggestion() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SuggestStreamOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      interests: "",
      academicPerformance: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setResult(null);
    try {
      const res = await suggestStream(values);
      setResult(res);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get suggestion. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-accent" />
          Stream Suggestion (After 10th)
        </CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-grow">
          <CardContent className="space-y-4 flex-grow">
            <FormField
              control={form.control}
              name="interests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interests</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Science projects, creative writing..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="academicPerformance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class 10 Performance</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Strong in Maths, average in Social Studies..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Thinking..." : "Suggest Stream"}
            </Button>
          </CardFooter>
        </form>
      </Form>

      {loading && (
        <div className="p-6 border-t border-white/20 dark:border-white/10">
          <Skeleton className="h-6 w-1/4 mb-2" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {result && (
        <div className="p-6 border-t border-white/20 dark:border-white/10 space-y-4">
          <div>
            <h4 className="font-semibold">Suggested Stream</h4>
            <p className="text-primary font-bold text-lg">{result.suggestedStream}</p>
          </div>
          <div>
            <h4 className="font-semibold">Reasoning</h4>
            <p className="text-muted-foreground text-sm">{result.reasoning}</p>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
