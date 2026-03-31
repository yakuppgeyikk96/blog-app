import type {
  ApiResponse,
  PaginatedApiResponse,
  PostListItemDto,
  PostResponseDto,
} from "@repo/shared-types";
import { serverApi } from "@/lib/server-api";

export async function fetchPublishedPosts(
  page = 1,
  limit = 12,
  tag?: string,
  q?: string,
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (tag) params.set("tag", tag);
  if (q) params.set("q", q);

  return serverApi<PaginatedApiResponse<PostListItemDto>>(
    `/posts?${params.toString()}`,
  );
}

export async function fetchPostBySlug(slug: string) {
  return serverApi<ApiResponse<{ post: PostResponseDto }>>(
    `/posts/by-slug/${slug}`,
  );
}

export async function fetchPopularPosts(limit = 5) {
  return serverApi<ApiResponse<{ items: PostListItemDto[] }>>(
    `/posts/popular?limit=${limit}`,
  );
}
