"use server";

import { revalidatePath } from "next/cache";
import type { PaginatedApiResponse, PostListItemDto } from "@repo/shared-types";
import { serverApi } from "@/lib/server-api";

export async function fetchMyPosts(
  page = 1,
  limit = 20,
): Promise<PaginatedApiResponse<PostListItemDto>> {
  return serverApi<PaginatedApiResponse<PostListItemDto>>(
    `/posts/me?page=${page}&limit=${limit}`,
  );
}

export async function deletePost(id: string): Promise<void> {
  await serverApi(`/posts/${id}`, { method: "DELETE" });
  revalidatePath("/dashboard/posts");
}
