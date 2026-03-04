import type { PaginatedApiResponse, PostListItemDto } from "@repo/shared-types";
import { serverApi } from "@/lib/server-api";

export async function fetchPublishedPosts(
  page = 1,
  limit = 12,
) {
  return serverApi<PaginatedApiResponse<PostListItemDto>>(
    `/posts?page=${page}&limit=${limit}`,
  );
}
