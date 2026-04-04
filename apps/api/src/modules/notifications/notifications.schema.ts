import { Type, type Static } from "@sinclair/typebox";

const ActorSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  avatar: Type.Union([Type.String(), Type.Null()]),
  slug: Type.String(),
});

const PostRefSchema = Type.Union([
  Type.Object({
    id: Type.String(),
    title: Type.String(),
    slug: Type.String(),
  }),
  Type.Null(),
]);

const NotificationSchema = Type.Object({
  id: Type.String(),
  type: Type.String(),
  actor: ActorSchema,
  post: PostRefSchema,
  read: Type.Boolean(),
  createdAt: Type.String({ format: "date-time" }),
});

const ListQuerystring = Type.Object({
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 50, default: 20 })),
  cursor: Type.Optional(Type.String()),
});

const NotificationIdParams = Type.Object({
  id: Type.String({ format: "uuid" }),
});

export type ListQuerystringType = Static<typeof ListQuerystring>;
export type NotificationIdParamsType = Static<typeof NotificationIdParams>;

export const listNotificationsSchema = {
  querystring: ListQuerystring,
  response: {
    200: Type.Object({
      success: Type.Literal(true),
      data: Type.Object({
        items: Type.Array(NotificationSchema),
        hasMore: Type.Boolean(),
      }),
    }),
  },
};

export const unreadCountSchema = {
  response: {
    200: Type.Object({
      success: Type.Literal(true),
      data: Type.Object({ count: Type.Integer() }),
    }),
  },
};

export const markAsReadSchema = {
  params: NotificationIdParams,
  response: {
    200: Type.Object({ success: Type.Literal(true) }),
  },
};
