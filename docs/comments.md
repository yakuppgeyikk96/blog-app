# Comments

## Overview

Authenticated users can comment on published posts. Comments support a single level of nesting (replies to top-level comments). Comment authors can edit or delete their own comments. Post authors can delete any comment on their posts.

## Database Design

### Table

```sql
CREATE TABLE "comments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "post_id" uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  "author_id" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "parent_id" uuid REFERENCES comments(id) ON DELETE CASCADE,
  "content" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
```

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | No | Primary key |
| `post_id` | uuid | No | Post being commented on |
| `author_id` | uuid | No | User who wrote the comment |
| `parent_id` | uuid | Yes | Parent comment (null = top-level, set = reply) |
| `content` | text | No | Comment body (sanitized HTML) |
| `created_at` | timestamp | No | When the comment was created |
| `updated_at` | timestamp | No | When the comment was last edited |

### Indexes

```sql
CREATE INDEX "idx_comments_post_id" ON comments(post_id, created_at);
CREATE INDEX "idx_comments_parent_id" ON comments(parent_id);
```

### Why Single-Level Nesting?

Deeply nested threads (like Reddit) add UI and query complexity. A single reply level (like YouTube, Medium) keeps the UX simple while still allowing conversation. Replies reference a `parent_id` but replies-to-replies are flat — they become siblings under the same parent.

### Content Sanitization

Comment content is sanitized using the existing `sanitizeContent()` function from `common/sanitize.ts`. This strips dangerous HTML while allowing basic formatting (bold, italic, links, code).

## API Design

### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/posts/:id/comments` | Public | List comments for a post (threaded) |
| POST | `/posts/:id/comments` | Required | Create a comment |
| PUT | `/comments/:id` | Required | Edit own comment |
| DELETE | `/comments/:id` | Required | Delete comment (own or post author) |

### Create Comment

```
POST /posts/:id/comments
Body: { content: string, parentId?: string }
→ { comment: CommentDto }
```

- `content` must be non-empty, max 2000 characters.
- `parentId` is optional — if provided, must reference an existing top-level comment on the same post.
- Replying to a reply is not allowed (keeps nesting to one level).

### List Comments

```
GET /posts/:id/comments
→ { comments: CommentWithRepliesDto[], total: number }
```

Returns top-level comments ordered by `created_at ASC`, each with a `replies` array. No pagination for now — comments are loaded all at once. Can be revisited if posts get hundreds of comments.

### Edit Comment

```
PUT /comments/:id
Body: { content: string }
→ { comment: CommentDto }
```

Only the comment author can edit. The `updatedAt` timestamp is updated to indicate the comment was edited.

### Delete Comment

```
DELETE /comments/:id
→ { success: true }
```

Allowed by comment author OR the post author (moderation). When a top-level comment is deleted, all replies are cascade-deleted via the FK constraint.

## Type Definitions

### CommentDto

```typescript
interface CommentDto {
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
```

### CommentWithRepliesDto

```typescript
interface CommentWithRepliesDto extends CommentDto {
  replies: CommentDto[];
}
```

### CreateCommentInput

```typescript
interface CreateCommentInput {
  content: string;
  parentId?: string;
}
```

## Backend Architecture

### Module Structure

```
modules/
  comments/
    comments.repository.ts
    comments.service.ts
    comments.handler.ts
    comments.schema.ts
    comments.mapper.ts
```

### Repository

```typescript
create(data: NewComment): Promise<Comment>
findById(id: string): Promise<Comment | undefined>
findByPostId(postId: string): Promise<CommentWithAuthor[]>
update(id: string, content: string): Promise<Comment | undefined>
delete(id: string): Promise<boolean>
countByPostId(postId: string): Promise<number>
```

### Service

```typescript
createComment(postId: string, userId: string, input: CreateCommentInput): Promise<CommentDto>
listByPost(postId: string): Promise<{ comments: CommentWithRepliesDto[], total: number }>
updateComment(commentId: string, userId: string, content: string): Promise<CommentDto>
deleteComment(commentId: string, userId: string): Promise<void>
```

Key business rules:
- `createComment` validates that the post exists and is published.
- `createComment` validates that `parentId` (if provided) references a top-level comment on the same post.
- `updateComment` checks ownership — only the comment author can edit.
- `deleteComment` checks ownership OR post authorship — post author can moderate.
- Content is sanitized before saving.

### Routes

Comment listing is a sub-resource of posts (`/posts/:id/comments`). Comment mutations (edit, delete) use their own ID (`/comments/:id`).

```
routes/
  posts/index.ts       → GET/POST /posts/:id/comments
  comments/index.ts    → PUT/DELETE /comments/:id
```

### Post Integration

Add `commentCount` to `PostResponseDto` and `PostListItemDto`. Fetched via a batch query similar to `getLikeCounts`.

## Frontend Design

### Comments Section (Post Detail)

Located below the post content on `/posts/:slug`. Shows:

1. **Comment count** heading (e.g., "12 Comments")
2. **Comment form** (textarea + submit button, visible only when authenticated)
3. **Comment list** — top-level comments, each with:
   - Author avatar + name (linked to `/authors/:slug`) + date
   - Comment content
   - Reply button (opens inline reply form)
   - Edit/Delete buttons (visible only to comment author or post author)
   - Replies indented below

### Components

```
components/
  comments/
    comment-section.tsx    → "use client", fetches and manages comment state
    comment-form.tsx       → Textarea + submit, reused for new comment and reply
    comment-item.tsx       → Single comment with actions
    comment-list.tsx       → Maps comments with replies
```

### Interaction Flow

- **Add comment** → Optimistic add to list + API call. On failure, remove and show error toast.
- **Reply** → Opens inline form below the comment. Same optimistic pattern.
- **Edit** → Inline edit mode (textarea replaces content). Save/Cancel buttons.
- **Delete** → Confirmation dialog. Optimistic removal on confirm.
- **Not authenticated** → Comment form shows "Log in to comment" with auth modal trigger.

### Edited Indicator

If `updatedAt > createdAt`, show "(edited)" text next to the date.

## Implementation Order

1. **Schema** — Drizzle schema for `comments` table + migration + indexes
2. **Shared Types** — `CommentDto`, `CommentWithRepliesDto`, `CreateCommentInput`
3. **Repository** — CRUD operations with author join
4. **Service** — Business logic (validation, ownership, sanitization)
5. **Handler + Schema + Route** — Endpoints for CRUD
6. **Post Integration** — Add `commentCount` to post responses
7. **Frontend** — Comment section component with form, list, and actions
