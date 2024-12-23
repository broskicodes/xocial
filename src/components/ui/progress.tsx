"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    color?: "default" | "primary" | "warning" | "destructive";
  }
>(({ className, value, color = "default", ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 transition-all",
        color === "default" && "bg-primary",
        color === "primary" && "bg-primary/40",
        color === "warning" && "bg-yellow-200/60",
        color === "destructive" && "bg-red-200/60",
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
