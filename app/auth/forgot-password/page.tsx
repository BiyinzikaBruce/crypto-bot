"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2 } from "lucide-react";
const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    await fetch("/api/auth/forget-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.email,
        redirectTo: "/auth/reset-password",
      }),
    });
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-8">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-profit-400" />
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            Email sent
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            If an account exists for that email, you&apos;ll receive a password
            reset link shortly.
          </p>
          <Link
            href="/auth/sign-in"
            className="mt-6 block text-[13px] text-primary-400 hover:text-primary-300 transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Reset password
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter your email and we&apos;ll send a reset link
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-[13px] font-medium text-slate-400 mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register("email")}
              className="w-full h-10 px-3 rounded-lg text-sm bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] placeholder:text-slate-500 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/20 transition-colors"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-[13px] text-loss-600 dark:text-loss-400">
                {errors.email.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Send reset link
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-slate-500">
          Remembered it?{" "}
          <Link
            href="/auth/sign-in"
            className="text-primary-400 hover:text-primary-300 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
