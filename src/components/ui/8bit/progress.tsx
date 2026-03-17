import * as ProgressPrimitive from "@radix-ui/react-progress";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

import "@/components/ui/8bit/styles/retro.css";

export const progressVariants = cva("", {
  variants: {
    variant: {
      default: "",
      retro: "retro",
    },
    font: {
      normal: "",
      retro: "retro",
    },
  },
  defaultVariants: {
    font: "retro",
  },
});

export interface BitProgressProps
  extends React.ComponentProps<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  className?: string;
  font?: VariantProps<typeof progressVariants>["font"];
  progressBg?: string;
}

const RETRO_PROGRESS_SEGMENTS = Array.from(
  { length: 20 },
  (_, index) => `segment-${index}`,
);

function Progress({
  className,
  font,
  variant,
  value,
  progressBg,
  ...props
}: BitProgressProps) {
  // Extract height from className if present
  const heightMatch = className?.match(/h-(\d+|\[.*?\])/);
  const heightClass = heightMatch ? heightMatch[0] : "h-2";

  return (
    <div className={cn("relative w-full", className)}>
      <ProgressPrimitive.Root
        data-slot="progress"
        className={cn(
          "relative w-full overflow-hidden bg-primary/20",
          heightClass,
          font !== "normal" && "retro",
        )}
        value={value}
        {...props}
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className={cn(
            "h-full transition-all",
            variant === "retro" ? "flex w-full" : "w-full flex-1",
            variant !== "retro" && (progressBg || "bg-primary"),
          )}
          style={
            variant === "retro"
              ? undefined
              : { transform: `translateX(-${100 - (value || 0)}%)` }
          }
        >
          {variant === "retro" && (
            <div className="flex w-full">
              {RETRO_PROGRESS_SEGMENTS.map((segmentId, index) => {
                const filledSquares = Math.round(((value || 0) / 100) * 20);
                return (
                  <div
                    key={segmentId}
                    className={cn(
                      "mx-[1px] h-full flex-1",
                      index < filledSquares
                        ? progressBg || "bg-primary"
                        : "bg-transparent",
                    )}
                  />
                );
              })}
            </div>
          )}
        </ProgressPrimitive.Indicator>
      </ProgressPrimitive.Root>

      <div
        className="pointer-events-none absolute inset-0 -my-1 border-foreground border-y-4 dark:border-ring"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute inset-0 -mx-1 border-foreground border-x-4 dark:border-ring"
        aria-hidden="true"
      />
    </div>
  );
}

export { Progress };
