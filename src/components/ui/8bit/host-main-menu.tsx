import { Button } from "@/components/ui/8bit/button";
import { cn } from "@/lib/utils";

interface HostMainMenuProps {
  className?: string;
  description: string;
  eyebrow: string;
  heroImageAlt?: string;
  heroImageSrc?: string;
  title: string;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  pending?: boolean;
}

export function HostMainMenu({
  className,
  description,
  eyebrow,
  heroImageAlt,
  heroImageSrc,
  title,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  pending = false,
}: HostMainMenuProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-4 border-black/80 bg-[linear-gradient(180deg,rgba(255,196,84,0.24),rgba(23,14,8,0.96))] p-6 text-stone-50 shadow-[12px_12px_0_0_rgba(18,12,8,0.6)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-3 bg-[repeating-linear-gradient(90deg,#f59e0b_0_16px,#fcd34d_16px_32px)]" />
      <p className="retro mt-4 text-[11px] text-amber-200 uppercase tracking-[0.28em]">
        {eyebrow}
      </p>
      {heroImageSrc ? (
        <div className="mt-6 overflow-hidden border-4 border-black/80 bg-[linear-gradient(180deg,rgba(10,10,14,0.65),rgba(10,10,14,0.95))] p-2 shadow-[8px_8px_0_0_rgba(18,12,8,0.45)]">
          <div className="overflow-hidden border-2 border-amber-300/50 bg-black/30">
            <img
              src={heroImageSrc}
              alt={heroImageAlt ?? title}
              className="block aspect-[11/6] w-full object-cover object-center"
            />
          </div>
        </div>
      ) : null}
      <h1 className="mt-6 max-w-3xl font-black text-4xl leading-tight tracking-tight sm:text-6xl">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-base text-stone-200 leading-7 sm:text-lg">
        {description}
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Button
          font="retro"
          size="lg"
          type="button"
          disabled={pending}
          onClick={onPrimaryAction}
        >
          {pending ? "Summoning..." : primaryActionLabel}
        </Button>
        {secondaryActionLabel && onSecondaryAction ? (
          <Button
            font="retro"
            size="lg"
            type="button"
            variant="outline"
            onClick={onSecondaryAction}
          >
            {secondaryActionLabel}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
