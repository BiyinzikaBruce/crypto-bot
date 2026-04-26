import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FXAU — Automate Your Gold & Forex Trading",
    template: "%s | FXAU",
  },
  description:
    "Automate XAUUSD and USD pair trading through MetaTrader 5 — no code required. Build strategies, backtest, deploy live bots.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                classNames: {
                  toast:
                    "bg-[var(--card)] border border-[var(--card-border)] text-[var(--foreground)] rounded-lg shadow-lg",
                  title: "text-sm font-medium",
                  description: "text-xs text-[var(--muted-foreground)]",
                  success: "text-profit-600 dark:text-profit-400",
                  error: "text-loss-600 dark:text-loss-400",
                  warning: "text-warning-600 dark:text-warning-400",
                  info: "text-primary-600 dark:text-primary-400",
                },
              }}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
