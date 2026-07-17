import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/auth/"],
      },
      {
        userAgent: "GPTBot",
        allow: "/blog/",
        disallow: "/",
      },
      {
        userAgent: "Google-Extended",
        allow: "/blog/",
        disallow: "/",
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
      },
    ],
    sitemap: "https://trypriceshield.com/sitemap.xml",
    host: "https://trypriceshield.com",
  };
}
