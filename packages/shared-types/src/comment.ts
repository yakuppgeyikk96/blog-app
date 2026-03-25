export interface CommentDto {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    slug: string;
    avatar: string | null;
  };
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentWithRepliesDto extends CommentDto {
  replies: CommentDto[];
}

export interface CreateCommentInput {
  content: string;
  parentId?: string;
}
