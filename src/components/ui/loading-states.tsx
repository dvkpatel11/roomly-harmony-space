
import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Loader2Icon } from "lucide-react";

// Spinner
interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const Spinner: React.FC<SpinnerProps> = ({ size = "md", className, ...props }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className={cn("flex items-center justify-center", className)} {...props}>
      <Loader2Icon className={cn("animate-spin text-muted-foreground", sizeClasses[size])} />
    </div>
  );
};

// Loading overlay
interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  loading: boolean;
  children: React.ReactNode;
  label?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  loading, 
  children, 
  label = "Loading...",
  className,
  ...props 
}) => {
  return (
    <div className={cn("relative", className)} {...props}>
      {children}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <Spinner size="lg" />
          {label && <p className="mt-2 text-sm text-muted-foreground">{label}</p>}
        </div>
      )}
    </div>
  );
};

// Card skeleton
const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="gap-2">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="pb-2">
        <Skeleton className="h-24 w-full" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  );
};

// Table skeleton
const TableSkeleton: React.FC<{ 
  rows?: number; 
  columns?: number;
  showHeader?: boolean;
  className?: string;
}> = ({ 
  rows = 5, 
  columns = 4, 
  showHeader = true,
  className 
}) => {
  return (
    <div className={cn("w-full space-y-4", className)}>
      {showHeader && (
        <div className="flex gap-4 pb-2">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={`header-${i}`} className="h-6 flex-1" />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

// Shimmering card
const ShimmerCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("overflow-hidden rounded-lg border bg-card", className)}>
      <div className="h-full w-full animate-pulse space-y-5 p-4">
        <div className="h-24 rounded-md bg-muted/70" />
        <div className="space-y-2">
          <div className="h-4 w-3/4 rounded-md bg-muted/70" />
          <div className="h-4 w-1/2 rounded-md bg-muted/70" />
        </div>
        <div className="flex justify-between pt-4">
          <div className="h-8 w-24 rounded-md bg-muted/70" />
          <div className="h-8 w-16 rounded-md bg-muted/70" />
        </div>
      </div>
    </div>
  );
};

// Empty state
interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 p-8 text-center",
        className
      )}
      {...props}
    >
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-medium">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export {
  Spinner,
  LoadingOverlay,
  CardSkeleton,
  TableSkeleton,
  ShimmerCard,
  EmptyState,
};
