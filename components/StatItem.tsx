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
    <div className="relative my-2 flex flex-col rounded-lg bg-white px-3 py-2 shadow-sm dark:bg-white/10">
      <div className="text-2xl font-light dark:text-white">
        {value}
        <span className="text-xs font-normal text-gray-500 dark:text-white/50">
          {" "}
          {unit}
        </span>
      </div>
      {children}
      <div className="flex items-center justify-between gap-1 text-xs text-gray-500 dark:text-white/50">
        {title}
        <Icon size={16} className="opacity-20" />
      </div>
    </div>
  );
}
