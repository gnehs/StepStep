import { twMerge } from "tailwind-merge";

export default function Button({
  className,
  children,
  ...props
}: {
  className?: string;
  children?: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={twMerge(
        `rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600`,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
