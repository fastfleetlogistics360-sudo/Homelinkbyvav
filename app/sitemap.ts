import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://homelinkbyvav.com.ng";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const publicRoutes = ["/", "/auth/login", "/auth/signup", "/terms"];

  return publicRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.6
  }));
}
