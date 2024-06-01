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
    <div className="relative my-2 flex flex-col rounded-lg bg-white px-3 py-2 shadow-sm">
      <div className="flex items-center gap-1 text-sm text-gray-500">
        {title}
      </div>
      <div className="text-xl font-bold">
        {value}
        <span className="text-sm font-normal"> {unit}</span>
      </div>
      {children}
      <Icon
        size={48}
        className="absolute bottom-0 right-3 top-0 m-auto opacity-20"
      />
    </div>
  );
}
