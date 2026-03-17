import { cn } from "@/lib/utils";

interface PlayerProfileCardProps {
  className?: string;
  detail: string;
  heading: string;
  name: string;
  status: string;
}

export function PlayerProfileCard({
  className,
  detail,
  heading,
  name,
  status,
}: PlayerProfileCardProps) {
  return (
    <section
      className={cn(
        "border-4 border-black/80 bg-[linear-gradient(180deg,rgba(252,211,77,0.18),rgba(24,17,13,0.98))] p-5 text-stone-50 shadow-[8px_8px_0_0_rgba(18,12,8,0.55)]",
        className,
      )}
    >
      <p className="retro text-[10px] text-amber-200 uppercase tracking-[0.24em]">
        {status}
      </p>
      <h2 className="mt-4 font-black text-2xl tracking-tight">{heading}</h2>
      <p className="mt-2 text-lg text-stone-100">{name}</p>
      <p className="mt-4 text-sm text-stone-300 leading-6">{detail}</p>
    </section>
  );
}
