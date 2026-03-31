import { createHash } from "node:crypto";
import type { InteractionsRepository } from "./interactions.repository";

function hashViewerIp(ip: string): string {
  const today = new Date().toISOString().split("T")[0];
  return createHash("sha256").update(`${ip}:${today}`).digest("hex");
}

interface InteractionsServiceDeps {
  interactionsRepository: InteractionsRepository;
}

export function createInteractionsService({
  interactionsRepository,
}: InteractionsServiceDeps) {
  return {
    async toggleLike(
      userId: string,
      postId: string,
    ): Promise<{ liked: boolean; likeCount: number }> {
      const liked = await interactionsRepository.toggleLike(userId, postId);
      const likeCount = await interactionsRepository.getLikeCount(postId);
      return { liked, likeCount };
    },

    async toggleBookmark(
      userId: string,
      postId: string,
    ): Promise<{ bookmarked: boolean }> {
      const bookmarked = await interactionsRepository.toggleBookmark(
        userId,
        postId,
      );
      return { bookmarked };
    },

    async getLikeCounts(postIds: string[]): Promise<Map<string, number>> {
      return interactionsRepository.getLikeCounts(postIds);
    },

    async getUserInteractions(
      userId: string,
      postIds: string[],
    ): Promise<
      Map<string, { liked: boolean; bookmarked: boolean }>
    > {
      return interactionsRepository.getUserInteractions(userId, postIds);
    },

    async getBookmarkedPostIds(
      userId: string,
      offset: number,
      limit: number,
    ): Promise<{ postIds: string[]; total: number }> {
      return interactionsRepository.getBookmarkedPostIds(userId, offset, limit);
    },

    async recordView(postId: string, ip: string): Promise<void> {
      const viewerHash = hashViewerIp(ip);
      await interactionsRepository.recordView(postId, viewerHash);
    },

    async getViewCounts(postIds: string[]): Promise<Map<string, number>> {
      return interactionsRepository.getViewCounts(postIds);
    },

    async getPopularPostIds(limit: number, days = 7): Promise<string[]> {
      return interactionsRepository.getPopularPostIds(limit, days);
    },
  };
}

export type InteractionsService = ReturnType<typeof createInteractionsService>;
