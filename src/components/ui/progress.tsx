import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type ProgressProps = ComponentProps<"div"> & {
  value: number;
};

function Progress({ value, className, ...props }: ProgressProps) {
  const normalizedValue = Math.max(0, Math.min(100, value));

  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={normalizedValue}
      className={cn("h-2 overflow-hidden rounded-full bg-slate-200", className)}
      {...props}
    >
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--accent-green))] transition-[width] duration-500"
        style={{ width: `${normalizedValue}%` }}
      />
    </div>
  );
}

export { Progress };
