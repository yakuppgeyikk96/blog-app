import type { PaginatedApiResponse, PostListItemDto } from "@repo/shared-types";
import { buildRss, rssResponse } from "@/lib/rss";

const API_URL = process.env.API_URL ?? "http://localhost:4000";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://papyra.dev";

export async function GET() {
  let items: PostListItemDto[] = [];

  try {
    const res = await fetch(`${API_URL}/posts?limit=50&page=1`, {
      next: { revalidate: 3600 },
    });
    const data: PaginatedApiResponse<PostListItemDto> = await res.json();
    items = data.data.items;
  } catch {
    // Return empty feed on API failure
  }

  const xml = buildRss({
    title: "Papyra",
    description: "Discover stories, ideas, and insights.",
    feedUrl: `${SITE_URL}/feed.xml`,
    items,
  });

  return rssResponse(xml);
}

export const dynamic = "force-dynamic";
