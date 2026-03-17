import { cn } from "@/lib/utils";

interface FriendListItem {
  id: string;
  label: string;
  detail?: string;
}

interface FriendListProps {
  className?: string;
  emptyLabel: string;
  title: string;
  items: FriendListItem[];
}

export function FriendList({
  className,
  emptyLabel,
  title,
  items,
}: FriendListProps) {
  return (
    <section
      className={cn(
        "border-4 border-black/80 bg-[linear-gradient(180deg,rgba(32,20,14,0.96),rgba(15,9,6,0.98))] p-4 text-stone-50 shadow-[8px_8px_0_0_rgba(18,12,8,0.5)]",
        className,
      )}
    >
      <h3 className="retro text-[11px] text-amber-200 uppercase tracking-[0.22em]">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-stone-300 leading-6">{emptyLabel}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-4 border-2 border-amber-300/40 bg-black/20 px-3 py-3"
            >
              <span className="font-semibold text-sm text-stone-100">
                {item.label}
              </span>
              {item.detail ? (
                <span className="text-amber-200 text-xs uppercase tracking-[0.2em]">
                  {item.detail}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
