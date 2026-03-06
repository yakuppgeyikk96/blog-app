import { eq, inArray } from "drizzle-orm";
import type { DbType } from "../../db/connection";
import { tags, postTags } from "../../db/schema/index";

export type Tag = typeof tags.$inferSelect;

export function createTagsRepository(db: DbType) {
  return {
    async findAll(): Promise<Tag[]> {
      return db.select().from(tags).orderBy(tags.name);
    },

    async findByNames(names: string[]): Promise<Tag[]> {
      if (names.length === 0) return [];
      return db.select().from(tags).where(inArray(tags.name, names));
    },

    async findByPostId(postId: string): Promise<Tag[]> {
      return db
        .select({
          id: tags.id,
          name: tags.name,
          slug: tags.slug,
          createdAt: tags.createdAt,
        })
        .from(tags)
        .innerJoin(postTags, eq(tags.id, postTags.tagId))
        .where(eq(postTags.postId, postId));
    },

    async findByPostIds(
      postIds: string[],
    ): Promise<Map<string, Tag[]>> {
      if (postIds.length === 0) return new Map();

      const rows = await db
        .select({
          postId: postTags.postId,
          id: tags.id,
          name: tags.name,
          slug: tags.slug,
          createdAt: tags.createdAt,
        })
        .from(postTags)
        .innerJoin(tags, eq(postTags.tagId, tags.id))
        .where(inArray(postTags.postId, postIds));

      const map = new Map<string, Tag[]>();
      for (const row of rows) {
        const existing = map.get(row.postId) ?? [];
        existing.push({
          id: row.id,
          name: row.name,
          slug: row.slug,
          createdAt: row.createdAt,
        });
        map.set(row.postId, existing);
      }
      return map;
    },

    async create(name: string, slug: string): Promise<Tag> {
      const result = await db
        .insert(tags)
        .values({ name, slug })
        .returning();

      const tag = result[0];
      if (!tag) {
        throw new Error("Failed to create tag");
      }
      return tag;
    },

    async syncPostTags(postId: string, tagIds: string[]): Promise<void> {
      await db.delete(postTags).where(eq(postTags.postId, postId));

      if (tagIds.length > 0) {
        await db
          .insert(postTags)
          .values(tagIds.map((tagId) => ({ postId, tagId })));
      }
    },
  };
}

export type TagsRepository = ReturnType<typeof createTagsRepository>;
