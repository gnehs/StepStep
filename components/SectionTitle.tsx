import { twMerge } from "tailwind-merge";
export default function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={twMerge("text-sm tracking-wide opacity-75", className)}>
      {children}
    </div>
  );
}
