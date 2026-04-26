"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    const result = await authClient.resetPassword({
      newPassword: data.password,
      token,
    });
    setLoading(false);

    if (result.error) {
      toast.error(result.error.message ?? "Reset failed");
    } else {
      toast.success("Password updated — please sign in");
      router.push("/auth/sign-in");
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            New password
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Choose a strong password for your account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-[13px] font-medium text-slate-400 mb-1.5"
            >
              New password
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

          <div>
            <label
              htmlFor="confirm"
              className="block text-[13px] font-medium text-slate-400 mb-1.5"
            >
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              {...register("confirm")}
              className="w-full h-10 px-3 rounded-lg text-sm bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] placeholder:text-slate-500 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/20 transition-colors"
              placeholder="Repeat password"
            />
            {errors.confirm && (
              <p className="mt-1 text-[13px] text-loss-600 dark:text-loss-400">
                {errors.confirm.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full h-10 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Update password
          </button>
        </form>
      </div>
    </div>
  );
}
