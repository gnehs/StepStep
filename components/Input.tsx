import { twMerge } from "tailwind-merge";

export default function Input({
  className,
  ...props
}: { className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={twMerge(
        "border-2 border-transparent bg-white rounded-lg px-4 py-2 w-full outline-none focus:border-blue-500",
        className
      )}
      {...props}
    />
  );
}
