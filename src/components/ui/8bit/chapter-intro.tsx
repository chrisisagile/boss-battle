import { cn } from "@/lib/utils";

interface ChapterIntroProps {
  className?: string;
  kicker: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}

export function ChapterIntro({
  className,
  kicker,
  title,
  description,
  children,
}: ChapterIntroProps) {
  return (
    <section
      className={cn(
        "border-4 border-black/80 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.4),transparent_38%),linear-gradient(180deg,rgba(41,24,14,0.98),rgba(17,10,6,0.98))] p-6 text-stone-50 shadow-[10px_10px_0_0_rgba(18,12,8,0.5)]",
        className,
      )}
    >
      <p className="retro text-[10px] text-amber-200 uppercase tracking-[0.3em]">
        {kicker}
      </p>
      <h2 className="mt-4 font-black text-3xl tracking-tight sm:text-5xl">
        {title}
      </h2>
      <p className="mt-4 max-w-2xl text-base text-stone-200 leading-7">
        {description}
      </p>
      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}
