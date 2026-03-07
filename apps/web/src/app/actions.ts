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
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (tag) params.set("tag", tag);

  return serverApi<PaginatedApiResponse<PostListItemDto>>(
    `/posts?${params.toString()}`,
  );
}

export async function fetchPostBySlug(slug: string) {
  return serverApi<ApiResponse<{ post: PostResponseDto }>>(
    `/posts/by-slug/${slug}`,
  );
}
