import type { TagDto } from "@repo/shared-types";
import type { TagsRepository } from "./tags.repository";

interface TagsServiceDeps {
  tagsRepository: TagsRepository;
}

export function createTagsService({ tagsRepository }: TagsServiceDeps) {
  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function toTagDto(tag: { id: string; name: string; slug: string }): TagDto {
    return { id: tag.id, name: tag.name, slug: tag.slug };
  }

  return {
    async list(): Promise<TagDto[]> {
      const allTags = await tagsRepository.findAll();
      return allTags.map(toTagDto);
    },

    async getTagsForPost(postId: string): Promise<TagDto[]> {
      const postTags = await tagsRepository.findByPostId(postId);
      return postTags.map(toTagDto);
    },

    async getTagsForPosts(
      postIds: string[],
    ): Promise<Map<string, TagDto[]>> {
      const tagMap = await tagsRepository.findByPostIds(postIds);
      const dtoMap = new Map<string, TagDto[]>();
      for (const [postId, tags] of tagMap) {
        dtoMap.set(postId, tags.map(toTagDto));
      }
      return dtoMap;
    },

    async syncPostTags(postId: string, tagNames: string[]): Promise<void> {
      const uniqueNames = [...new Set(tagNames.map((n) => n.trim()).filter(Boolean))];

      if (uniqueNames.length === 0) {
        await tagsRepository.syncPostTags(postId, []);
        return;
      }

      const existing = await tagsRepository.findByNames(uniqueNames);
      const existingMap = new Map(existing.map((t) => [t.name, t]));

      const tagIds: string[] = [];

      for (const name of uniqueNames) {
        const found = existingMap.get(name);
        if (found) {
          tagIds.push(found.id);
        } else {
          const slug = generateSlug(name);
          const created = await tagsRepository.create(name, slug);
          tagIds.push(created.id);
        }
      }

      await tagsRepository.syncPostTags(postId, tagIds);
    },
  };
}

export type TagsService = ReturnType<typeof createTagsService>;
