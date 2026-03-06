import type { PostsRepository } from "./posts.repository";
import type { TagsService } from "../tags/tags.service";
import type {
  CreatePostInput,
  UpdatePostInput,
  PostResponseDto,
  PostListItemDto,
  Pagination,
} from "./posts.types";
import { toPostResponseDto, toPostListItemDto } from "./posts.mapper";
import { sanitizeContent } from "../../common/sanitize";

interface PostsServiceDeps {
  postsRepository: PostsRepository;
  tagsService: TagsService;
  httpErrors: {
    notFound: (message: string) => Error;
    forbidden: (message: string) => Error;
  };
}

export function createPostsService({
  postsRepository,
  tagsService,
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

  async function generateUniqueSlug(
    title: string,
    excludePostId?: string,
  ): Promise<string> {
    const baseSlug = generateBaseSlug(title);
    const existingSlugs = await postsRepository.findSlugStartingWith(
      baseSlug,
      excludePostId,
    );

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
        content: sanitizeContent(input.content ?? ""),
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

      const tags = await tagsService.getTagsForPost(post.id);
      return toPostResponseDto(post, tags);
    },

    async getBySlug(
      slug: string,
      userId?: string,
    ): Promise<PostResponseDto> {
      const post = await postsRepository.findBySlugWithAuthor(slug);
      if (!post) {
        throw httpErrors.notFound("Post not found");
      }

      if (!post.published && post.authorId !== userId) {
        throw httpErrors.notFound("Post not found");
      }

      const tags = await tagsService.getTagsForPost(post.id);
      return toPostResponseDto(post, tags);
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

      const postIds = items.map((p) => p.id);
      const tagMap = await tagsService.getTagsForPosts(postIds);

      return {
        items: items.map((item) =>
          toPostListItemDto(item, tagMap.get(item.id) ?? []),
        ),
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

      const postIds = items.map((p) => p.id);
      const tagMap = await tagsService.getTagsForPosts(postIds);

      return {
        items: items.map((item) =>
          toPostListItemDto(item, tagMap.get(item.id) ?? []),
        ),
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

      const isPublishing = input.published === true && !existing.published;
      if (isPublishing) {
        const currentTitle = input.title ?? existing.title;
        updateData.slug = await generateUniqueSlug(currentTitle, id);
      }

      if (input.title !== undefined) {
        updateData.title = input.title;
      }
      if (input.content !== undefined) {
        updateData.content = sanitizeContent(input.content);
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

      if (input.tags !== undefined) {
        await tagsService.syncPostTags(id, input.tags);
      }

      const updated = await postsRepository.findByIdWithAuthor(id);
      if (!updated) {
        throw httpErrors.notFound("Post not found");
      }

      const tags = await tagsService.getTagsForPost(id);
      return toPostResponseDto(updated, tags);
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
