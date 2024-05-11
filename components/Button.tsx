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
        `bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600`,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
