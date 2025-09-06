
"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { structuredAdvisorChat } from "@/ai/flows/chatbot";
import { auth, db } from "@/lib/firebase";
import { doc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, where, getDocs, writeBatch, Timestamp } from "firebase/firestore";
import type { User } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Bot, Loader2, Send, User as UserIcon, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ConversationMessage } from "@/ai/flows/types";

const formSchema = z.object({
  query: z.string().min(1, "Message cannot be empty."),
});

// A version of ConversationMessage for client-side state that can handle Timestamps
type ClientConversationMessage = Omit<ConversationMessage, 'timestamp'> & {
    timestamp?: Timestamp | { toDate: () => Date };
};


export function Chatbot() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
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

  // Fetch chat history
  useEffect(() => {
    if (!user) return;

    const chatHistoryCollectionRef = collection(db, "users", user.uid, "chatHistory");
    const q = query(chatHistoryCollectionRef, orderBy("timestamp", "asc"));

    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
       const history = snapshot.docs.map(doc => {
        const data = doc.data();
        const message: ConversationMessage = {
          role: data.role,
          content: data.content
        };
        // Timestamps are complex objects; we don't need them for the AI flow.
        // We only pass role and content to the AI.
        return message;
      });
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

  // Scroll to bottom
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
    const userQuery = values.query;
    form.reset();
    
    const userMessage: ConversationMessage = { content: userQuery, role: 'user' };
    
    // Optimistically update UI
    const tempMessages = [...messages, userMessage];
    setMessages(tempMessages);

    // Save user message to Firestore with a server timestamp
    const chatHistoryCollectionRef = collection(db, "users", user.uid, "chatHistory");
    const userMessageForDb = { ...userMessage, timestamp: serverTimestamp() };
    const userMessageDocRef = await addDoc(chatHistoryCollectionRef, userMessageForDb);

    try {
      // The history passed to the server action is now clean
      const res = await structuredAdvisorChat({ query: userQuery, history: messages });
      const aiMessage: ConversationMessage = { content: res.response, role: 'ai' };

      // Save AI response to Firestore, also with a server timestamp
       await addDoc(chatHistoryCollectionRef, { ...aiMessage, timestamp: serverTimestamp() });

       // Let onSnapshot handle the final state update from Firestore
    } catch (error: any) {
      console.error(error);
      const errorMessage: ConversationMessage = { content: "Sorry, I encountered an error. Please try again.", role: 'ai' };
      setMessages(prev => [...prev, errorMessage]);
      
      // Optionally remove the failed user message from firestore
      // await deleteDoc(userMessageDocRef);

      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to get a response from the AI.",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleClearHistory = async () => {
    if (!user) return;
    
    const chatHistoryCollectionRef = collection(db, "users", user.uid, "chatHistory");
    const snapshot = await getDocs(chatHistoryCollectionRef);
    if(snapshot.empty) return;
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => batch.delete(doc.ref));

    try {
      await batch.commit();
      setMessages([]); // Clear state immediately
      toast({ title: "Chat History Cleared" });
    } catch (error) {
      console.error("Error clearing chat history:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not clear chat history." });
    }
  };


  return (
    <Card className="flex flex-col h-full w-full border-none shadow-none bg-transparent">
      <div className="flex items-center justify-between pr-4 pb-2">
        <Button variant="ghost" size="sm" onClick={handleClearHistory} disabled={messages.length === 0}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear History
        </Button>
      </div>
      <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden p-0">
        <ScrollArea className="flex-grow pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={cn("flex items-start gap-3", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'ai' && (
                  <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                    <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
                  </Avatar>
                )}
                <div className={cn("max-w-xs md:max-w-md lg:max-w-lg rounded-xl px-4 py-2 text-sm", msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary')}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
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
             {messages.length === 0 && !loading && (
                <div className="text-center text-muted-foreground pt-10">
                    <Bot className="mx-auto h-12 w-12" />
                    <p className="mt-4">Start a conversation with your Pathfinder AI advisor.</p>
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
                    <Input placeholder="Ask for career advice, college suggestions, etc." {...field} autoComplete="off" disabled={loading || !user} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="icon" disabled={loading || !user}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Form>
      </CardFooter>
    </Card>
  );
}
