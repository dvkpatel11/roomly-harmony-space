import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import React from "react";

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  centered?: boolean;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  centered = false,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        centered && "fixed inset-0 bg-background/80 backdrop-blur-sm",
        className
      )}
      {...props}
    >
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
    </div>
  );
};

export default LoadingSpinner;
