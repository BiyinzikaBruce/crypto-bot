import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.BETTER_AUTH_URL ?? "https://fxau.app";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/auth/sign-in", "/auth/sign-up"],
        disallow: ["/dashboard/", "/admin/", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
