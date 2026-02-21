import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-section flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-[1.75rem] font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground/60 mt-2">{description}</p>
        )}
      </div>
      {action && (
        <Button asChild className="w-full shrink-0 sm:w-auto">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
