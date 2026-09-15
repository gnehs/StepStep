import { LucideIcon } from "lucide-react";
export default function StatItem({
  title,
  value,
  unit,
  children,
  Icon,
}: {
  title: string;
  value: string;
  unit?: string;
  children?: React.ReactNode;
  Icon: LucideIcon;
}) {
  return (
    <div className="surface-card relative my-2 flex min-w-0 flex-col gap-2 p-4">
      <div className="text-[28px] font-semibold tracking-tight break-words tabular-nums dark:text-white">
        {value}
        <span className="text-xs font-normal tracking-normal text-primary-600 dark:text-primary-300">
          {" "}
          {unit}
        </span>
      </div>
      {children}
      <div className="flex items-center justify-between gap-1 text-xs font-medium text-primary-600 dark:text-primary-300">
        {title}
        <Icon
          size={16}
          aria-hidden="true"
          className="shrink-0 text-primary-400"
        />
      </div>
    </div>
  );
}
