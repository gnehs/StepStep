import { twMerge } from "tailwind-merge";
export default function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={twMerge("opacity-75 tracking-wide text-sm", className)}>
      {children}
    </div>
  );
}
