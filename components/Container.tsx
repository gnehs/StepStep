export default function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-[min(512px,calc(100vw-32px))]">{children}</div>
  );
}
