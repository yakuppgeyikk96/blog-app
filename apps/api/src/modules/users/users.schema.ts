import { Type, type Static } from "@sinclair/typebox";

const UserResponseSchema = Type.Object({
  id: Type.String(),
  email: Type.String(),
  name: Type.String(),
  avatar: Type.Union([Type.String(), Type.Null()]),
  bio: Type.Union([Type.String(), Type.Null()]),
  website: Type.Union([Type.String(), Type.Null()]),
  slug: Type.String(),
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.String({ format: "date-time" }),
});

const AuthorProfileSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  avatar: Type.Union([Type.String(), Type.Null()]),
  bio: Type.Union([Type.String(), Type.Null()]),
  website: Type.Union([Type.String(), Type.Null()]),
  slug: Type.String(),
  postCount: Type.Integer(),
  createdAt: Type.String({ format: "date-time" }),
});

const UpdateProfileBody = Type.Object({
  bio: Type.Optional(Type.Union([Type.String({ maxLength: 300 }), Type.Null()])),
  website: Type.Optional(
    Type.Union([Type.String({ format: "uri" }), Type.Null()]),
  ),
  slug: Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
});

const AuthorSlugParams = Type.Object({
  slug: Type.String({ minLength: 1 }),
});

const PaginationQuerystring = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 50, default: 10 })),
});

export type UpdateProfileBodyType = Static<typeof UpdateProfileBody>;
export type AuthorSlugParamsType = Static<typeof AuthorSlugParams>;
export type PaginationQuerystringType = Static<typeof PaginationQuerystring>;

export const getProfileSchema = {
  response: {
    200: Type.Object({
      success: Type.Literal(true),
      data: Type.Object({ user: UserResponseSchema }),
    }),
  },
};

export const updateProfileSchema = {
  body: UpdateProfileBody,
  response: {
    200: Type.Object({
      success: Type.Literal(true),
      data: Type.Object({ user: UserResponseSchema }),
    }),
  },
};

export const uploadAvatarSchema = {
  response: {
    200: Type.Object({
      success: Type.Literal(true),
      data: Type.Object({ user: UserResponseSchema }),
    }),
  },
};

export const getAuthorProfileSchema = {
  params: AuthorSlugParams,
  response: {
    200: Type.Object({
      success: Type.Literal(true),
      data: Type.Object({ author: AuthorProfileSchema }),
    }),
  },
};
