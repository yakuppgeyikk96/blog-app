import type {
  ApiResponse,
  AuthorProfileDto,
  PaginatedApiResponse,
  PostListItemDto,
} from "@repo/shared-types";
import { serverApi } from "@/lib/server-api";

export async function fetchAuthorProfile(slug: string) {
  return serverApi<ApiResponse<{ author: AuthorProfileDto }>>(
    `/users/${slug}`,
  );
}

export async function fetchAuthorPosts(
  authorId: string,
  page = 1,
  limit = 12,
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    authorId,
  });

  return serverApi<PaginatedApiResponse<PostListItemDto>>(
    `/posts?${params.toString()}`,
  );
}
