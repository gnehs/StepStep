import { twMerge } from "tailwind-merge";

export default function Input({
  className,
  ...props
}: { className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={twMerge("ios-input w-full disabled:opacity-50", className)}
      {...props}
    />
  );
}
