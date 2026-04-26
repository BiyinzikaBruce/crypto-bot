import Link from "next/link";
import { Mail } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <div className="w-full max-w-sm text-center">
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-500/10">
          <Mail className="h-7 w-7 text-primary-400" />
        </div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">
          Check your email
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          We sent you a verification link. Click it to activate your account and
          start trading.
        </p>
        <p className="mt-6 text-[13px] text-slate-500">
          Already verified?{" "}
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
