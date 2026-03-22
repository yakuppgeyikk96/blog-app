# Likes & Bookmarks

## Overview

Authenticated users can **like** and **bookmark** posts. Likes are public (count shown on post cards and detail page). Bookmarks are private (only visible to the user who bookmarked).

## Database Design

### Tables

Two separate junction tables — likes and bookmarks are independent concerns.

```sql
CREATE TABLE "post_likes" (
  "user_id" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "post_id" uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  "created_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("user_id", "post_id")
);

CREATE TABLE "post_bookmarks" (
  "user_id" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "post_id" uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  "created_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("user_id", "post_id")
);
```

### Why Separate Tables?

- **Different visibility** — Likes are public (aggregated count), bookmarks are private (user-specific list).
- **Independent lifecycle** — A user can like without bookmarking and vice versa.
- **Simpler queries** — No need for a `type` column or conditional filtering.

### Why No Counter Column on Posts?

A denormalized `like_count` column on `posts` would be faster to read but requires keeping it in sync (triggers or application logic). For a blog app's scale, `COUNT(*)` on the junction table with a primary key index is fast enough. This can be revisited if performance becomes an issue.

## API Design

### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/posts/:id/like` | Required | Toggle like (like if not liked, unlike if already liked) |
| POST | `/posts/:id/bookmark` | Required | Toggle bookmark |
| GET | `/posts/bookmarks` | Required | List user's bookmarked posts |

### Toggle Pattern

Both like and bookmark use a **toggle** pattern — a single endpoint that adds or removes:

```
POST /posts/:id/like
→ Try DELETE first. If row deleted → { liked: false, likeCount: N }
→ If nothing deleted → INSERT ON CONFLICT DO NOTHING → { liked: true, likeCount: N }
```

This approach is race-condition safe — no SELECT+INSERT gap that could cause duplicate key errors under concurrent requests. The frontend uses a single button with optimistic updates.

### Response Changes

#### PostListItemDto (updated)

```typescript
interface PostListItemDto {
  // ...existing fields
  likeCount: number;
  liked: boolean;      // false if not authenticated
  bookmarked: boolean; // false if not authenticated
}
```

#### PostResponseDto (updated)

```typescript
interface PostResponseDto {
  // ...existing fields
  likeCount: number;
  liked: boolean;
  bookmarked: boolean;
}
```

`liked` and `bookmarked` are always `false` for unauthenticated users — no need for nullable fields.

## Backend Architecture

### Module Structure

```
modules/
  interactions/
    interactions.handler.ts
    interactions.service.ts
    interactions.repository.ts
    interactions.schema.ts
```

Like and bookmark share the same module since they have identical patterns (toggle on a junction table). No separate route file — endpoints are registered in the posts route since they are nested under `/posts/:id`.

### Repository

```typescript
// Toggle operations (DELETE first, INSERT ON CONFLICT)
toggleLike(userId: string, postId: string): Promise<boolean>
toggleBookmark(userId: string, postId: string): Promise<boolean>

// Batch queries for post list hydration
getLikeCount(postId: string): Promise<number>
getLikeCounts(postIds: string[]): Promise<Map<string, number>>
getUserInteractions(userId: string, postIds: string[]): Promise<Map<string, { liked: boolean; bookmarked: boolean }>>
getBookmarkedPostIds(userId: string, offset: number, limit: number): Promise<{ postIds: string[]; total: number }>
```

### Integration with Posts

The `InteractionsService` is injected into `PostsService` as a dependency. When fetching posts, interaction data (like counts + user's like/bookmark state) is batch-fetched via `Promise.all` alongside tags — same pattern as `getTagsForPosts`. Public list endpoints use `optionalAuthenticate` so logged-in users see their like/bookmark state.

## Frontend Design

### UI Elements

#### Post Card
- Heart icon with like count + bookmark icon (bottom-right of card, opposite author/date)

#### Post Detail Page
- Heart icon with like count (in the header area, after author/date)
- Bookmark icon (next to like)

### Interaction Behavior

- Click heart → optimistic toggle + API call
- Click bookmark → optimistic toggle + API call
- If not authenticated → open login modal
- Icons use filled variant when active (red for like, yellow for bookmark), outline when inactive
- On API failure → rollback to previous state

### Bookmarks Page

A new `/dashboard/bookmarks` page showing the user's bookmarked posts. Same grid layout as homepage, with pagination.

## Implementation Order

1. **Schema** — Drizzle schema for `postLikes` and `postBookmarks` tables + migration
2. **Shared Types** — Update `PostListItemDto` and `PostResponseDto` with like/bookmark fields
3. **Repository** — CRUD operations for likes and bookmarks
4. **Service + Handler + Route** — Toggle endpoints and bookmarks list
5. **Posts Integration** — Hydrate like/bookmark data into post responses
6. **Frontend Components** — Like/bookmark buttons with optimistic updates
7. **Bookmarks Page** — Dashboard page for bookmarked posts
