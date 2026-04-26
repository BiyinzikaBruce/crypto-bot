"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-loss-600/10">
          <AlertTriangle className="h-8 w-8 text-loss-400" />
        </div>
        <h1 className="text-[30px] font-semibold text-[var(--foreground)] leading-tight">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex h-10 items-center px-4 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white transition-colors duration-150"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
