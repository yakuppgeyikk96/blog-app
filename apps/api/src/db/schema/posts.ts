import {
  boolean,
  customType,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { sql, type SQL } from "drizzle-orm";
import { users } from "./users";

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  summary: text("summary"),
  content: text("content").notNull(),
  coverImage: text("cover_image"),
  published: boolean("published").notNull().default(false),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  searchVector: tsvector("search_vector").generatedAlwaysAs(
    (): SQL =>
      sql`setweight(to_tsvector('simple', coalesce(${posts.title}, '')), 'A') || setweight(to_tsvector('simple', coalesce(${posts.summary}, '')), 'B') || setweight(to_tsvector('simple', coalesce(${posts.content}, '')), 'C')`,
  ),
}, (t) => [
  index("idx_posts_search").using("gin", t.searchVector),
]);
