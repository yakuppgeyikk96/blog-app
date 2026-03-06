import { Type } from "@sinclair/typebox";

const TagSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  slug: Type.String(),
});

const SuccessTagListResponse = Type.Object({
  success: Type.Literal(true),
  data: Type.Object({
    tags: Type.Array(TagSchema),
  }),
});

export const listTagsSchema = {
  response: { 200: SuccessTagListResponse },
};
