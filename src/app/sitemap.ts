import type { MetadataRoute } from "next";
import { publishedEditions } from "@/domain/selectors";
import { SITE_URL } from "@/lib/site";
import { seed } from "@/seed/seed";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const editions = publishedEditions(seed().editions);
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    ...editions.map((e) => ({
      url: `${SITE_URL}/ediciones/${e.slug}/`,
      changeFrequency: "weekly" as const,
      priority: e.isPast ? 0.5 : 0.9,
    })),
  ];
}
