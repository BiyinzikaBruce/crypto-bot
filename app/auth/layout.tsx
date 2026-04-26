import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <div className="flex items-center justify-center h-16 px-6 border-b border-[var(--card-border)]">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-primary-400"
        >
          FXAU
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  );
}
