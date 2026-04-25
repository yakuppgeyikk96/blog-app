import type {
  ApiResponse,
  AuthorProfileDto,
  PaginatedApiResponse,
  PostListItemDto,
} from "@repo/shared-types";
import { buildRss, rssResponse } from "@/lib/rss";

const API_URL = process.env.API_URL ?? "http://localhost:4000";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://papyra.dev";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  let author: AuthorProfileDto | null = null;
  let items: PostListItemDto[] = [];

  try {
    const [authorRes, postsRes] = await Promise.all([
      fetch(`${API_URL}/users/${slug}`, { next: { revalidate: 3600 } }),
      fetch(`${API_URL}/posts?limit=50&page=1`, { next: { revalidate: 3600 } }),
    ]);

    if (!authorRes.ok) {
      return new Response("Author not found", { status: 404 });
    }

    const authorData: ApiResponse<{ author: AuthorProfileDto }> =
      await authorRes.json();
    author = authorData.data.author;

    const postsData: PaginatedApiResponse<PostListItemDto> =
      await postsRes.json();
    items = postsData.data.items.filter(
      (post) => post.author.slug === slug,
    );
  } catch {
    return rssResponse(
      buildRss({
        title: "Papyra",
        description: "",
        feedUrl: `${SITE_URL}/authors/${slug}/feed.xml`,
        items: [],
      }),
    );
  }

  const xml = buildRss({
    title: `${author.name} — Papyra`,
    description: author.bio ?? `Posts by ${author.name}`,
    feedUrl: `${SITE_URL}/authors/${slug}/feed.xml`,
    items,
  });

  return rssResponse(xml);
}

export const dynamic = "force-dynamic";
