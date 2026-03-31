import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { posts } from "./posts";

export const postViews = pgTable(
  "post_views",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    viewerHash: text("viewer_hash").notNull(),
    viewedAt: timestamp("viewed_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_post_views_unique").on(table.postId, table.viewerHash),
    index("idx_post_views_post_id").on(table.postId),
  ],
);
