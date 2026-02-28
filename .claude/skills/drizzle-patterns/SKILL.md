---
name: drizzle-patterns
description: Drizzle ORM and PostgreSQL best practices. Use when writing or reviewing database schemas, migrations, or queries.
user-invokable: false
---

# Drizzle ORM + PostgreSQL Patterns

## Schema Design
- Define schemas in `apps/api/drizzle/schema/` with one file per table.
- Use `pgTable` for table definitions.
- Always include `createdAt` and `updatedAt` timestamps.
- Use `uuid` for primary keys (use `gen_random_uuid()` default).

```typescript
// drizzle/schema/posts.ts
import { pgTable, uuid, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 250 }).notNull().unique(),
  content: text('content').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  authorId: uuid('author_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});
```

## Schema Conventions
- **Table names:** plural, snake_case (`posts`, `user_sessions`)
- **Column names:** snake_case (`author_id`, `created_at`)
- **Index names:** `idx_<table>_<columns>` (`idx_posts_slug`)
- Always define foreign key relations explicitly.
- Add indexes on columns used in WHERE, JOIN, and ORDER BY clauses.

## Relations
- Define relations in a separate file or alongside the schema.
- Use Drizzle's `relations` API for type-safe joins.

```typescript
import { relations } from 'drizzle-orm';

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));
```

## Queries
- Use the query builder API for simple queries, raw SQL for complex ones.
- Always use parameterized queries — never interpolate user input.
- Select only the columns you need — avoid `SELECT *`.
- Use pagination with `limit` and `offset` (or cursor-based for large datasets).

```typescript
// Good — select specific columns
const result = await db
  .select({
    id: posts.id,
    title: posts.title,
    slug: posts.slug,
    createdAt: posts.createdAt,
  })
  .from(posts)
  .where(eq(posts.status, 'published'))
  .orderBy(desc(posts.createdAt))
  .limit(10)
  .offset(0);
```

## Repository Pattern
- Wrap Drizzle queries in repository functions.
- Return typed results — the service layer should not know about Drizzle internals.
- Keep queries focused — one query per function.

## Migrations
- Generate migrations with `drizzle-kit generate`.
- Apply migrations with `drizzle-kit migrate`.
- Never modify a migration that has been applied — create a new one.
- Review generated SQL before applying.

## Performance
- Use `prepare()` for frequently executed queries.
- Add indexes for columns in WHERE clauses and foreign keys.
- Use transactions for multi-step operations (`db.transaction()`).
- Avoid N+1 queries — use joins or batch loading.

## Security
- Never trust user input in queries — always use parameterized queries.
- Never expose internal IDs or database errors to the client.
- Use row-level checks in the service layer (e.g., user can only edit own posts).
