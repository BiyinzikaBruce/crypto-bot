"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { signUp } from "@/lib/auth-client";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof schema>;

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    const result = await signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
      callbackURL: "/auth/verify-email",
    });
    setLoading(false);

    if (result.error) {
      toast.error(result.error.message ?? "Sign up failed");
    } else {
      toast.success("Check your email to verify your account");
      router.push("/auth/verify-email");
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Create account
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Start automating your trading for free
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-[13px] font-medium text-slate-400 mb-1.5"
            >
              Full name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              {...register("name")}
              className="w-full h-10 px-3 rounded-lg text-sm bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] placeholder:text-slate-500 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/20 transition-colors"
              placeholder="John Smith"
            />
            {errors.name && (
              <p className="mt-1 text-[13px] text-loss-600 dark:text-loss-400">
                {errors.name.message}
              </p>
            )}
          </div>

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
              autoComplete="email"
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

          <div>
            <label
              htmlFor="password"
              className="block text-[13px] font-medium text-slate-400 mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
              className="w-full h-10 px-3 rounded-lg text-sm bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] placeholder:text-slate-500 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/20 transition-colors"
              placeholder="Min. 8 characters"
            />
            {errors.password && (
              <p className="mt-1 text-[13px] text-loss-600 dark:text-loss-400">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-slate-500">
          Already have an account?{" "}
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
