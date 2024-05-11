export default function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-[min(512px,calc(100vw-32px))] mx-auto">{children}</div>
  );
}
