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
    <div className="flex justify-between bg-white rounded-lg p-2 my-2 items-center shadow-sm">
      <div className="flex flex-col">
        <div className="text-2xl font-bold">
          {value}
          <span className="text-base font-normal"> {unit}</span>
        </div>
        <div className="text-sm text-gray-500">{title}</div>
        {children}
      </div>
      <Icon size={48} className="opacity-20" />
    </div>
  );
}
