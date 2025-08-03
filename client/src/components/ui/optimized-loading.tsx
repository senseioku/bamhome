import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OptimizedLoadingProps {
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "pulse" | "skeleton";
  text?: string;
  className?: string;
}

export function OptimizedLoading({ 
  size = "md", 
  variant = "spinner", 
  text,
  className 
}: OptimizedLoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  if (variant === "spinner") {
    return (
      <div className={cn("flex items-center justify-center gap-2", className)}>
        <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
        {text && <span className="text-sm text-muted-foreground">{text}</span>}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={cn("bg-primary/20 rounded-full animate-pulse", sizeClasses[size])} />
        {text && <span className="text-sm text-muted-foreground animate-pulse">{text}</span>}
      </div>
    );
  }

  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
      </div>
    );
  }

  return null;
}

// Message skeleton for chat loading
export function MessageSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={cn(
          "flex gap-3",
          i % 2 === 0 ? "justify-start" : "justify-end"
        )}>
          <div className={cn(
            "space-y-2 max-w-[70%]",
            i % 2 === 0 ? "order-1" : "order-2"
          )}>
            <div className="h-3 bg-muted rounded animate-pulse w-20" />
            <div className="p-3 rounded-lg bg-muted animate-pulse">
              <div className="h-4 bg-muted-foreground/20 rounded animate-pulse" />
              <div className="h-4 bg-muted-foreground/20 rounded animate-pulse w-3/4 mt-2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Conversation list skeleton
export function ConversationSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-3 rounded-lg border animate-pulse">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 bg-muted rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}