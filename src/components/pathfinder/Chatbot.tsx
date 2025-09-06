
"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { freeformChat } from "@/ai/flows/chatbot";
import { auth, db } from "@/lib/firebase";
import { doc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import type { User } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Bot, Loader2, Send, User as UserIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  query: z.string().min(1, "Message cannot be empty."),
});

type Message = {
  id?: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp?: Date;
}

export function Chatbot() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { query: "" },
  });

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(currentUser => {
      setUser(currentUser);
      if (!currentUser) {
        setMessages([]);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const chatHistoryCollectionRef = collection(db, "users", user.uid, "chatHistory");
    const q = query(chatHistoryCollectionRef, orderBy("timestamp", "asc"));

    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
      const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(history);
    }, (error) => {
      console.error("Error fetching chat history:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load your chat history.",
      });
    });

    return () => unsubscribeFirestore();
  }, [user, toast]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: "smooth"
        });
    }
  }, [messages]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: "destructive", title: "Not Logged In", description: "You must be logged in to chat." });
      return;
    }
    
    setLoading(true);
    form.reset();
    
    const userMessage: Message = { text: values.query, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);

    // Save user message to Firestore
    const chatHistoryCollectionRef = collection(db, "users", user.uid, "chatHistory");
    await addDoc(chatHistoryCollectionRef, userMessage);

    try {
      const res = await freeformChat(values);
      const aiMessage: Message = { text: res.response, sender: 'ai', timestamp: new Date() };
      setMessages(prev => [...prev, aiMessage]);

      // Save AI response to Firestore
      await addDoc(chatHistoryCollectionRef, aiMessage);

    } catch (error: any) {
      console.error(error);
      const errorMessage = { text: "Sorry, I encountered an error. Please try again.", sender: 'ai', timestamp: new Date() } as Message;
      setMessages(prev => [..._prev, errorMessage]);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to get a response from the AI.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex flex-col h-full w-full border-none shadow-none bg-transparent">
      <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden p-0">
        <ScrollArea className="flex-grow pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={cn("flex items-start gap-3", msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.sender === 'ai' && (
                  <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                    <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
                  </Avatar>
                )}
                <div className={cn("max-w-xs md:max-w-md lg:max-w-lg rounded-xl px-4 py-2 text-sm", msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary')}>
                  {msg.text}
                </div>
                {msg.sender === 'user' && (
                   <Avatar className="h-8 w-8">
                     <AvatarFallback><UserIcon className="h-5 w-5" /></AvatarFallback>
                   </Avatar>
                )}
              </div>
            ))}
            {loading && (
                <div className="flex items-start gap-3 justify-start">
                    <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                        <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
                    </Avatar>
                    <div className="bg-secondary rounded-xl px-4 py-3">
                        <Loader2 className="h-5 w-5 animate-spin"/>
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-4 p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full items-center gap-2">
            <FormField
              control={form.control}
              name="query"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormControl>
                    <Input placeholder="Ask me anything..." {...field} autoComplete="off" disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="icon" disabled={loading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Form>
      </CardFooter>
    </Card>
  );
}
