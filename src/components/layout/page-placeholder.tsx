import type { LucideIcon } from "lucide-react";

type PagePlaceholderProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function PagePlaceholder({
  title,
  description,
  icon: Icon,
}: PagePlaceholderProps) {
  return (
    <div className="mx-auto flex min-h-[55vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl border bg-card text-muted-foreground">
        <Icon className="size-5" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <p className="mt-5 rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground">
        Coming soon
      </p>
    </div>
  );
}
