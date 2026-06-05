import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TooltipProps = {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
};

function Tooltip({ content, children, side = "top", className }: TooltipProps) {
  return (
    <span className={cn("tooltip-wrap", className)} data-side={side}>
      {children}
      <span className="tooltip-bubble" role="tooltip">
        {content}
      </span>
    </span>
  );
}

export { Tooltip };
