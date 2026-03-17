import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type * as React from "react";
import {
  Select as ShadcnSelect,
  SelectContent as ShadcnSelectContent,
  SelectGroup as ShadcnSelectGroup,
  SelectItem as ShadcnSelectItem,
  SelectLabel as ShadcnSelectLabel,
  SelectScrollDownButton as ShadcnSelectScrollDownButton,
  SelectScrollUpButton as ShadcnSelectScrollUpButton,
  SelectSeparator as ShadcnSelectSeparator,
  SelectTrigger as ShadcnSelectTrigger,
  SelectValue as ShadcnSelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import "@/components/ui/8bit/styles/retro.css";

export const inputVariants = cva("", {
  variants: {
    font: {
      normal: "",
      retro: "retro",
    },
  },
  defaultVariants: {
    font: "retro",
  },
});

type FontVariantProps = VariantProps<typeof inputVariants>;

function Select(props: React.ComponentProps<typeof ShadcnSelect>) {
  return <ShadcnSelect {...props} />;
}

function SelectGroup(props: React.ComponentProps<typeof ShadcnSelectGroup>) {
  return <ShadcnSelectGroup {...props} />;
}

function SelectValue({
  className,
  font,
  ...props
}: React.ComponentProps<typeof ShadcnSelectValue> & FontVariantProps) {
  return (
    <ShadcnSelectValue
      className={cn(font !== "normal" && "retro", className)}
      {...props}
    />
  );
}

function SelectTrigger({
  children,
  className,
  font,
  ...props
}: React.ComponentProps<typeof ShadcnSelectTrigger> & FontVariantProps) {
  return (
    <div
      className={cn(
        "retro relative border-foreground border-y-6 dark:border-ring",
        font === "normal" && "font-sans",
        className,
      )}
    >
      <ShadcnSelectTrigger
        className="w-full rounded-none border-0 bg-transparent ring-0"
        {...props}
      >
        {children}
      </ShadcnSelectTrigger>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -mx-1.5 border-foreground border-x-6 dark:border-ring"
      />
    </div>
  );
}

function SelectContent({
  children,
  className,
  font,
  ...props
}: React.ComponentProps<typeof ShadcnSelectContent> & FontVariantProps) {
  return (
    <ShadcnSelectContent
      className={cn(
        "relative mt-1 -ml-1 rounded-none border-4 border-foreground dark:border-ring",
        font !== "normal" && "retro",
        className,
      )}
      {...props}
    >
      {children}
    </ShadcnSelectContent>
  );
}

function SelectLabel(props: React.ComponentProps<typeof ShadcnSelectLabel>) {
  return <ShadcnSelectLabel {...props} />;
}

function SelectItem({
  className,
  ...props
}: React.ComponentProps<typeof ShadcnSelectItem>) {
  return (
    <ShadcnSelectItem
      className={cn(
        "rounded-none border-ring/0 border-y-3 border-dashed hover:border-foreground dark:hover:border-ring",
        className,
      )}
      {...props}
    />
  );
}

function SelectSeparator(
  props: React.ComponentProps<typeof ShadcnSelectSeparator>,
) {
  return <ShadcnSelectSeparator {...props} />;
}

function SelectScrollUpButton(
  props: React.ComponentProps<typeof ShadcnSelectScrollUpButton>,
) {
  return <ShadcnSelectScrollUpButton {...props} />;
}

function SelectScrollDownButton(
  props: React.ComponentProps<typeof ShadcnSelectScrollDownButton>,
) {
  return <ShadcnSelectScrollDownButton {...props} />;
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
