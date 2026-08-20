import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      data-astryx-control="skeleton"
      className={className} 
      {...props} 
    />
  );
}

export { Skeleton };
