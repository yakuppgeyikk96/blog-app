import { and, count, desc, eq, ne, sql } from "drizzle-orm";
import type { DbType } from "../../db/connection";
import { posts } from "../../db/schema/index";
import { users } from "../../db/schema/index";

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

export type PostWithAuthor = Post & { authorName: string };

export function createPostsRepository(db: DbType) {
  const postWithAuthorColumns = {
    id: posts.id,
    title: posts.title,
    slug: posts.slug,
    summary: posts.summary,
    content: posts.content,
    coverImage: posts.coverImage,
    published: posts.published,
    authorId: posts.authorId,
    createdAt: posts.createdAt,
    updatedAt: posts.updatedAt,
    authorName: users.name,
  };

  return {
    async findById(id: string): Promise<Post | undefined> {
      const result = await db
        .select()
        .from(posts)
        .where(eq(posts.id, id));

      return result[0];
    },

    async findByIdWithAuthor(
      id: string,
    ): Promise<PostWithAuthor | undefined> {
      const result = await db
        .select(postWithAuthorColumns)
        .from(posts)
        .innerJoin(users, eq(posts.authorId, users.id))
        .where(eq(posts.id, id));

      return result[0];
    },

    async findSlugStartingWith(
      baseSlug: string,
    ): Promise<{ slug: string }[]> {
      return db
        .select({ slug: posts.slug })
        .from(posts)
        .where(
          sql`${posts.slug} = ${baseSlug} OR ${posts.slug} LIKE ${baseSlug + "-%"}`,
        );
    },

    async findMany(options: {
      offset: number;
      limit: number;
      excludeAuthorId?: string;
    }): Promise<{ items: PostWithAuthor[]; total: number }> {
      const conditions = [eq(posts.published, true)];

      if (options.excludeAuthorId) {
        conditions.push(ne(posts.authorId, options.excludeAuthorId));
      }

      const whereClause = and(...conditions);

      const items = await db
        .select(postWithAuthorColumns)
        .from(posts)
        .innerJoin(users, eq(posts.authorId, users.id))
        .where(whereClause)
        .orderBy(desc(posts.createdAt))
        .limit(options.limit)
        .offset(options.offset);

      const [countResult] = await db
        .select({ total: count() })
        .from(posts)
        .where(whereClause);

      return {
        items,
        total: countResult?.total ?? 0,
      };
    },

    async findByAuthor(options: {
      authorId: string;
      offset: number;
      limit: number;
    }): Promise<{ items: PostWithAuthor[]; total: number }> {
      const whereClause = eq(posts.authorId, options.authorId);

      const items = await db
        .select(postWithAuthorColumns)
        .from(posts)
        .innerJoin(users, eq(posts.authorId, users.id))
        .where(whereClause)
        .orderBy(desc(posts.createdAt))
        .limit(options.limit)
        .offset(options.offset);

      const [countResult] = await db
        .select({ total: count() })
        .from(posts)
        .where(whereClause);

      return {
        items,
        total: countResult?.total ?? 0,
      };
    },

    async create(data: NewPost): Promise<Post> {
      const result = await db.insert(posts).values(data).returning();

      const post = result[0];
      if (!post) {
        throw new Error("Failed to create post");
      }

      return post;
    },

    async update(
      id: string,
      data: Partial<Omit<NewPost, "id" | "authorId" | "createdAt">>,
    ): Promise<Post | undefined> {
      const result = await db
        .update(posts)
        .set(data)
        .where(eq(posts.id, id))
        .returning();

      return result[0];
    },

    async delete(id: string): Promise<boolean> {
      const result = await db
        .delete(posts)
        .where(eq(posts.id, id))
        .returning({ id: posts.id });

      return result.length > 0;
    },
  };
}

export type PostsRepository = ReturnType<typeof createPostsRepository>;
