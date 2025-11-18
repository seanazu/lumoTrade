import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-r from-bg-secondary via-bg-tertiary to-bg-secondary bg-[length:200%_100%]",
        className
      )}
      style={{
        animation: "shimmer 2s infinite",
      }}
      {...props}
    />
  );
}

export { Skeleton };

