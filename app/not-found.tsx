import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-slate-800">
          <SearchX className="h-8 w-8 text-slate-600" />
        </div>
        <h1 className="text-[30px] font-semibold text-[var(--foreground)] leading-tight">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto">
          This page doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-10 items-center px-4 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white transition-colors duration-150"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
