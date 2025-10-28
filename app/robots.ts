import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://calpolyredcross.org/sitemap.xml",
    host: "https://calpolyredcross.org",
  };
}
