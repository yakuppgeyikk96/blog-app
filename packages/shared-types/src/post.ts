export interface PostResponseDto {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  coverImage: string | null;
  published: boolean;
  author: {
    id: string;
    name: string;
  };
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
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostInput {
  title: string;
  content: string;
  summary?: string;
  coverImage?: string;
  published?: boolean;
}

export interface UpdatePostInput {
  title?: string;
  content?: string;
  summary?: string | null;
  coverImage?: string | null;
  published?: boolean;
}
