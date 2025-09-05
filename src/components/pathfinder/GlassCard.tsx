import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function GlassCard({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white/10 shadow-lg backdrop-blur-xl dark:bg-black/20",
        "border-white/20 dark:border-white/10",
        "transition-all duration-300 hover:shadow-2xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
