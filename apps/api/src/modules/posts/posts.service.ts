import type { PostsRepository } from "./posts.repository";
import type {
  CreatePostInput,
  UpdatePostInput,
  PostResponseDto,
  PostListItemDto,
  Pagination,
} from "./posts.types";
import { toPostResponseDto, toPostListItemDto } from "./posts.mapper";

interface PostsServiceDeps {
  postsRepository: PostsRepository;
  httpErrors: {
    notFound: (message: string) => Error;
    forbidden: (message: string) => Error;
  };
}

export function createPostsService({
  postsRepository,
  httpErrors,
}: PostsServiceDeps) {
  function generateBaseSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = generateBaseSlug(title);
    const existingSlugs = await postsRepository.findSlugStartingWith(baseSlug);

    if (existingSlugs.length === 0) {
      return baseSlug;
    }

    const slugSet = new Set(existingSlugs.map((r) => r.slug));

    if (!slugSet.has(baseSlug)) {
      return baseSlug;
    }

    let suffix = 1;
    while (slugSet.has(`${baseSlug}-${suffix}`)) {
      suffix++;
    }

    return `${baseSlug}-${suffix}`;
  }

  function assertOwnership(postAuthorId: string, userId: string): void {
    if (postAuthorId !== userId) {
      throw httpErrors.forbidden("You can only modify your own posts");
    }
  }

  return {
    async create(
      input: CreatePostInput,
      authorId: string,
    ): Promise<PostResponseDto> {
      const slug = await generateUniqueSlug(input.title);

      const post = await postsRepository.create({
        title: input.title,
        slug,
        content: input.content ?? "",
        summary: input.summary ?? null,
        coverImage: input.coverImage ?? null,
        published: input.published ?? false,
        authorId,
      });

      const postWithAuthor = await postsRepository.findByIdWithAuthor(post.id);
      if (!postWithAuthor) {
        throw httpErrors.notFound("Post not found");
      }

      return toPostResponseDto(postWithAuthor);
    },

    async getById(
      id: string,
      userId?: string,
    ): Promise<PostResponseDto> {
      const post = await postsRepository.findByIdWithAuthor(id);
      if (!post) {
        throw httpErrors.notFound("Post not found");
      }

      if (!post.published && post.authorId !== userId) {
        throw httpErrors.notFound("Post not found");
      }

      return toPostResponseDto(post);
    },

    async list(
      page: number,
      limit: number,
      userId?: string,
    ): Promise<{ items: PostListItemDto[]; pagination: Pagination }> {
      const clampedLimit = Math.min(Math.max(limit, 1), 50);
      const clampedPage = Math.max(page, 1);
      const offset = (clampedPage - 1) * clampedLimit;

      const { items, total } = await postsRepository.findMany({
        offset,
        limit: clampedLimit,
        excludeAuthorId: userId,
      });

      return {
        items: items.map(toPostListItemDto),
        pagination: {
          total,
          page: clampedPage,
          limit: clampedLimit,
          totalPages: Math.ceil(total / clampedLimit),
        },
      };
    },

    async listByAuthor(
      authorId: string,
      page: number,
      limit: number,
    ): Promise<{ items: PostListItemDto[]; pagination: Pagination }> {
      const clampedLimit = Math.min(Math.max(limit, 1), 50);
      const clampedPage = Math.max(page, 1);
      const offset = (clampedPage - 1) * clampedLimit;

      const { items, total } = await postsRepository.findByAuthor({
        authorId,
        offset,
        limit: clampedLimit,
      });

      return {
        items: items.map(toPostListItemDto),
        pagination: {
          total,
          page: clampedPage,
          limit: clampedLimit,
          totalPages: Math.ceil(total / clampedLimit),
        },
      };
    },

    async update(
      id: string,
      input: UpdatePostInput,
      userId: string,
    ): Promise<PostResponseDto> {
      const existing = await postsRepository.findById(id);
      if (!existing) {
        throw httpErrors.notFound("Post not found");
      }

      assertOwnership(existing.authorId, userId);

      const updateData: Record<string, unknown> = {};

      if (input.title !== undefined) {
        updateData.title = input.title;
      }
      if (input.content !== undefined) {
        updateData.content = input.content;
      }
      if (input.summary !== undefined) {
        updateData.summary = input.summary;
      }
      if (input.coverImage !== undefined) {
        updateData.coverImage = input.coverImage;
      }
      if (input.published !== undefined) {
        updateData.published = input.published;
      }

      await postsRepository.update(id, updateData);

      const updated = await postsRepository.findByIdWithAuthor(id);
      if (!updated) {
        throw httpErrors.notFound("Post not found");
      }

      return toPostResponseDto(updated);
    },

    async delete(id: string, userId: string): Promise<void> {
      const existing = await postsRepository.findById(id);
      if (!existing) {
        throw httpErrors.notFound("Post not found");
      }

      assertOwnership(existing.authorId, userId);

      await postsRepository.delete(id);
    },
  };
}

export type PostsService = ReturnType<typeof createPostsService>;
