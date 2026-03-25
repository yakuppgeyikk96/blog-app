import { Type, type Static } from "@sinclair/typebox";

const AuthorSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  slug: Type.String(),
  avatar: Type.Union([Type.String(), Type.Null()]),
});

const CommentSchema = Type.Object({
  id: Type.String(),
  content: Type.String(),
  author: AuthorSchema,
  parentId: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.String({ format: "date-time" }),
});

const CommentWithRepliesSchema = Type.Intersect([
  CommentSchema,
  Type.Object({ replies: Type.Array(CommentSchema) }),
]);

const PostIdParams = Type.Object({
  id: Type.String({ format: "uuid" }),
});

const CommentIdParams = Type.Object({
  id: Type.String({ format: "uuid" }),
});

const CreateCommentBody = Type.Object({
  content: Type.String({ minLength: 1, maxLength: 2000 }),
  parentId: Type.Optional(Type.String({ format: "uuid" })),
});

const UpdateCommentBody = Type.Object({
  content: Type.String({ minLength: 1, maxLength: 2000 }),
});

export type PostIdParamsType = Static<typeof PostIdParams>;
export type CommentIdParamsType = Static<typeof CommentIdParams>;
export type CreateCommentBodyType = Static<typeof CreateCommentBody>;
export type UpdateCommentBodyType = Static<typeof UpdateCommentBody>;

export const listCommentsSchema = {
  params: PostIdParams,
  response: {
    200: Type.Object({
      success: Type.Literal(true),
      data: Type.Object({
        comments: Type.Array(CommentWithRepliesSchema),
        total: Type.Integer(),
      }),
    }),
  },
};

export const createCommentSchema = {
  params: PostIdParams,
  body: CreateCommentBody,
  response: {
    201: Type.Object({
      success: Type.Literal(true),
      data: Type.Object({ comment: CommentSchema }),
    }),
  },
};

export const updateCommentSchema = {
  params: CommentIdParams,
  body: UpdateCommentBody,
  response: {
    200: Type.Object({
      success: Type.Literal(true),
      data: Type.Object({ comment: CommentSchema }),
    }),
  },
};

export const deleteCommentSchema = {
  params: CommentIdParams,
  response: {
    200: Type.Object({ success: Type.Literal(true) }),
  },
};
