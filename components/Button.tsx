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
        `ios-button pressable inline-flex w-auto items-center justify-center gap-2 px-5 py-3 disabled:cursor-not-allowed disabled:opacity-40`,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
