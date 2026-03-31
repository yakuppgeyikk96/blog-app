# View Count & Popular Posts

## Overview

Track post views to show view counts on post cards/detail and provide a "Popular Posts" section. Views are counted per unique visitor (not per page load) to avoid inflation.

## Database Design

### Table

```sql
CREATE TABLE "post_views" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "post_id" uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  "viewer_ip" text NOT NULL,
  "viewed_at" timestamp NOT NULL DEFAULT now()
);
```

| Column | Type | Description |
|--------|------|-------------|
| `post_id` | uuid | Post that was viewed |
| `viewer_ip` | text | Hashed IP for uniqueness (privacy-safe) |
| `viewed_at` | timestamp | When the view occurred |

### Indexes

```sql
CREATE UNIQUE INDEX "idx_post_views_unique" ON post_views(post_id, viewer_ip);
CREATE INDEX "idx_post_views_post_id" ON post_views(post_id);
```

### Why Unique Index on (post_id, viewer_ip)?

Same visitor viewing the same post multiple times counts as one view. The unique index enforces this with `INSERT ON CONFLICT DO NOTHING` — same race-condition safe pattern as likes/bookmarks.

### Why Hashed IP Instead of Raw IP?

Raw IPs are PII (personally identifiable information). We hash the IP with a daily rotating salt so:
- Same IP on the same day = same hash = one view per day
- Next day, same IP gets a different hash = can count again
- No way to reverse the hash back to the original IP

This gives daily unique views while respecting privacy.

## API Design

### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/posts/:id/view` | Public | Record a view (called from frontend) |
| GET | `/posts/popular` | Public | List most viewed posts (last 7 days) |

### Record View

```
POST /posts/:id/view
→ { success: true }
```

- Extracts viewer IP from request headers (`x-forwarded-for` or `request.ip`)
- Hashes IP with daily salt
- `INSERT ON CONFLICT DO NOTHING` — idempotent, no duplicates
- Returns immediately — no blocking the page load
- No authentication required

### Popular Posts

```
GET /posts/popular?limit=5
→ { items: PostListItemDto[] }
```

Returns the most viewed published posts in the last 7 days, ordered by view count descending.

## Type Changes

### PostResponseDto & PostListItemDto (updated)

```typescript
interface PostResponseDto {
  // ...existing fields
  viewCount: number;
}
```

### No Frontend State Needed

Unlike likes/bookmarks, view count is read-only on the frontend — no optimistic updates, no toggle state.

## Backend Architecture

### View Recording in Interactions Module

Extend the existing `interactions` module rather than creating a new one — views are an interaction like likes and bookmarks.

```
modules/
  interactions/
    interactions.repository.ts  → add view methods
    interactions.service.ts     → add recordView, getViewCounts
```

### Repository Methods

```typescript
recordView(postId: string, viewerHash: string): Promise<void>
getViewCount(postId: string): Promise<number>
getViewCounts(postIds: string[]): Promise<Map<string, number>>
getPopularPostIds(limit: number, days: number): Promise<string[]>
```

### IP Hashing

```typescript
import { createHash } from "node:crypto";

function hashViewerIp(ip: string): string {
  const today = new Date().toISOString().split("T")[0]; // "2026-03-31"
  return createHash("sha256").update(`${ip}:${today}`).digest("hex");
}
```

Daily rotation ensures:
- One view per IP per post per day
- No PII stored in database
- Simple, no external dependencies

## Frontend Design

### View Recording

Call `POST /posts/:id/view` when a post detail page is loaded. Fire-and-forget — don't wait for response or show loading state.

```typescript
// In post detail page (client component or useEffect)
useEffect(() => {
  fetch(`/api/posts/${postId}/view`, { method: "POST" });
}, [postId]);
```

### View Count Display

#### Post Card
- Eye icon with view count next to comment count

#### Post Detail
- View count in the header metadata (next to author/date)

### Popular Posts Section

Add a "Popular Posts" section to the homepage sidebar or below the main post grid. Simple list with post title, author, and view count.

## Implementation Order

1. **Schema** — Drizzle schema for `post_views` table + migration + indexes
2. **Shared Types** — Add `viewCount` to `PostResponseDto` and `PostListItemDto`
3. **Repository** — View CRUD + batch count + popular query
4. **Service** — `recordView` with IP hashing, `getViewCounts`, `getPopularPostIds`
5. **Route** — `POST /posts/:id/view` and `GET /posts/popular`
6. **Post Integration** — Hydrate `viewCount` into post responses
7. **Frontend** — View recording on page load, view count display, popular posts
