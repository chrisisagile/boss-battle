import type { BitProgressProps } from "@/components/ui/8bit/progress";
import { Progress } from "@/components/ui/8bit/progress";

interface HealthBarProps extends React.ComponentProps<"div"> {
  className?: string;
  props?: BitProgressProps;
  variant?: "retro" | "default";
  value?: number;
}

export function HealthBar({
  className,
  variant,
  value,
  ...props
}: HealthBarProps) {
  return (
    <Progress
      {...props}
      value={value}
      variant={variant}
      className={className}
      progressBg="bg-red-500"
    />
  );
}
