import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-gray-300 dark:bg-[#2b2c2c] animate-pulse rounded-md",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
