import { Type, type Static } from "@sinclair/typebox";

const AuthorSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
});

const TagSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  slug: Type.String(),
});

const PostResponseSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  slug: Type.String(),
  summary: Type.Union([Type.String(), Type.Null()]),
  content: Type.String(),
  coverImage: Type.Union([Type.String(), Type.Null()]),
  published: Type.Boolean(),
  author: AuthorSchema,
  tags: Type.Array(TagSchema),
  likeCount: Type.Integer(),
  liked: Type.Boolean(),
  bookmarked: Type.Boolean(),
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.String({ format: "date-time" }),
});

const PostListItemSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  slug: Type.String(),
  summary: Type.Union([Type.String(), Type.Null()]),
  coverImage: Type.Union([Type.String(), Type.Null()]),
  published: Type.Boolean(),
  author: AuthorSchema,
  tags: Type.Array(TagSchema),
  likeCount: Type.Integer(),
  liked: Type.Boolean(),
  bookmarked: Type.Boolean(),
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.String({ format: "date-time" }),
});

const PaginationSchema = Type.Object({
  total: Type.Integer(),
  page: Type.Integer(),
  limit: Type.Integer(),
  totalPages: Type.Integer(),
});

const CreatePostBody = Type.Object({
  title: Type.String({ minLength: 1, maxLength: 200 }),
  content: Type.Optional(Type.String()),
  summary: Type.Optional(Type.String({ maxLength: 500 })),
  coverImage: Type.Optional(Type.String({ format: "uri" })),
  published: Type.Optional(Type.Boolean()),
});

const UpdatePostBody = Type.Object({
  title: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })),
  content: Type.Optional(Type.String({ minLength: 1 })),
  summary: Type.Optional(
    Type.Union([Type.String({ maxLength: 500 }), Type.Null()]),
  ),
  coverImage: Type.Optional(
    Type.Union([Type.String({ format: "uri" }), Type.Null()]),
  ),
  published: Type.Optional(Type.Boolean()),
  tags: Type.Optional(Type.Array(Type.String({ minLength: 1, maxLength: 50 }))),
});

const PostIdParams = Type.Object({
  id: Type.String({ format: "uuid" }),
});

const PostSlugParams = Type.Object({
  slug: Type.String({ minLength: 1 }),
});

const ListPostsQuerystring = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 50, default: 10 })),
  tag: Type.Optional(Type.String({ minLength: 1 })),
  q: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })),
});

const SuccessPostResponse = Type.Object({
  success: Type.Literal(true),
  data: Type.Object({
    post: PostResponseSchema,
  }),
});

const SuccessPostListResponse = Type.Object({
  success: Type.Literal(true),
  data: Type.Object({
    items: Type.Array(PostListItemSchema),
    pagination: PaginationSchema,
  }),
});

const SuccessDeleteResponse = Type.Object({
  success: Type.Literal(true),
});

export type CreatePostBodyType = Static<typeof CreatePostBody>;
export type UpdatePostBodyType = Static<typeof UpdatePostBody>;
export type PostIdParamsType = Static<typeof PostIdParams>;
export type PostSlugParamsType = Static<typeof PostSlugParams>;
export type ListPostsQuerystringType = Static<typeof ListPostsQuerystring>;

export const createPostSchema = {
  body: CreatePostBody,
  response: { 201: SuccessPostResponse },
};

export const getPostSchema = {
  params: PostIdParams,
  response: { 200: SuccessPostResponse },
};

export const listPostsSchema = {
  querystring: ListPostsQuerystring,
  response: { 200: SuccessPostListResponse },
};

export const updatePostSchema = {
  params: PostIdParams,
  body: UpdatePostBody,
  response: { 200: SuccessPostResponse },
};

export const getPostBySlugSchema = {
  params: PostSlugParams,
  response: { 200: SuccessPostResponse },
};

export const deletePostSchema = {
  params: PostIdParams,
  response: { 200: SuccessDeleteResponse },
};
