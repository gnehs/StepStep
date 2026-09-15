import { twMerge } from "tailwind-merge";
export default function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={twMerge(
        "mt-7 mb-2 px-4 text-[13px] font-normal text-primary-600 dark:text-primary-400",
        className,
      )}
    >
      {children}
    </h2>
  );
}
