import { twMerge } from "tailwind-merge";

export default function Input({
  className,
  ...props
}: { className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={twMerge(
        "w-full rounded-lg border-2 border-transparent bg-white px-4 py-2 outline-none focus:border-blue-500 dark:bg-black/5",
        className,
      )}
      {...props}
    />
  );
}
