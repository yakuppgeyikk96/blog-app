import type { TagDto } from "./tag.js";

export interface PostResponseDto {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  contentJson: string | null;
  coverImage: string | null;
  published: boolean;
  author: {
    id: string;
    name: string;
    slug: string;
    avatar: string | null;
  };
  tags: TagDto[];
  likeCount: number;
  liked: boolean;
  bookmarked: boolean;
  commentCount: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostListItemDto {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  coverImage: string | null;
  published: boolean;
  author: {
    id: string;
    name: string;
    slug: string;
    avatar: string | null;
  };
  tags: TagDto[];
  likeCount: number;
  liked: boolean;
  bookmarked: boolean;
  commentCount: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostInput {
  title: string;
  content?: string;
  summary?: string;
  coverImage?: string;
  published?: boolean;
}

export interface UpdatePostInput {
  title?: string;
  content?: string;
  contentJson?: string;
  summary?: string | null;
  coverImage?: string | null;
  published?: boolean;
  tags?: string[];
}
