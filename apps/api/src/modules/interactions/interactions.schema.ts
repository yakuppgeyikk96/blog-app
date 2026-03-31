import { Type, type Static } from "@sinclair/typebox";

const PostIdParams = Type.Object({
  id: Type.String({ format: "uuid" }),
});

const ToggleLikeResponse = Type.Object({
  success: Type.Literal(true),
  data: Type.Object({
    liked: Type.Boolean(),
    likeCount: Type.Integer(),
  }),
});

const ToggleBookmarkResponse = Type.Object({
  success: Type.Literal(true),
  data: Type.Object({
    bookmarked: Type.Boolean(),
  }),
});

export type PostIdParamsType = Static<typeof PostIdParams>;

export const toggleLikeSchema = {
  params: PostIdParams,
  response: { 200: ToggleLikeResponse },
};

export const toggleBookmarkSchema = {
  params: PostIdParams,
  response: { 200: ToggleBookmarkResponse },
};

const RecordViewResponse = Type.Object({
  success: Type.Literal(true),
});

export const recordViewSchema = {
  params: PostIdParams,
  response: { 200: RecordViewResponse },
};
