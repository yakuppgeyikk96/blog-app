# Notifications

## Overview

Real-time in-app notifications for likes, comments, and replies. Delivered via Server-Sent Events (SSE). Designed to be extensible for email notifications and user preferences in the future.

## Notification Types

| Type | Trigger | Message | Recipient |
|------|---------|---------|-----------|
| `post_liked` | User likes a post | "{name} liked your post" | Post author |
| `post_commented` | User comments on a post | "{name} commented on your post" | Post author |
| `comment_replied` | User replies to a comment | "{name} replied to your comment" | Comment author |

Self-notifications are excluded — you don't get notified for your own actions.

## Database Design

### Table

```sql
CREATE TABLE "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "recipient_id" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "actor_id" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "type" text NOT NULL,
  "post_id" uuid REFERENCES posts(id) ON DELETE CASCADE,
  "comment_id" uuid REFERENCES comments(id) ON DELETE SET NULL,
  "read" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now()
);
```

| Column | Type | Description |
|--------|------|-------------|
| `recipient_id` | uuid | User who receives the notification |
| `actor_id` | uuid | User who triggered the action |
| `type` | text | Notification type (`post_liked`, `post_commented`, `comment_replied`) |
| `post_id` | uuid | Related post (for linking) |
| `comment_id` | uuid | Related comment (nullable, for reply notifications) |
| `read` | boolean | Whether the notification has been read |
| `created_at` | timestamp | When the notification was created |

### Indexes

```sql
CREATE INDEX "idx_notifications_recipient" ON notifications(recipient_id, created_at DESC);
CREATE INDEX "idx_notifications_unread" ON notifications(recipient_id) WHERE read = false;
```

### Future Extensibility

- **Email**: Add `email_sent` boolean column, background job checks for unsent notifications.
- **Preferences**: Add `notification_preferences` table with `(user_id, type, channel)` — user can disable specific types or channels.
- **New types**: Just add new type strings, no schema change needed.

## API Design

### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | Required | List notifications (paginated) |
| GET | `/notifications/stream` | Required | SSE stream for real-time |
| GET | `/notifications/unread-count` | Required | Get unread count |
| PUT | `/notifications/:id/read` | Required | Mark single notification as read |

### SSE Stream

```
GET /notifications/stream
Headers: Accept: text/event-stream

Response (keeps connection open):
data: {"id":"...","type":"post_liked","actor":{"name":"John"},"post":{"title":"...","slug":"..."},"createdAt":"..."}

data: {"id":"...","type":"post_commented",...}
```

Client connects with `EventSource`. Server holds connection and pushes new notifications as they happen. Each notification is a JSON object sent as an SSE `data` event.

### List Notifications

```
GET /notifications?limit=20&cursor=<last_id>
→ { items: NotificationDto[], hasMore: boolean }
```

Cursor-based pagination (not page-based) since new notifications arrive at the top.

### Unread Count

```
GET /notifications/unread-count
→ { count: number }
```

Lightweight endpoint for the header badge. Called on page load.

## Type Definitions

### NotificationDto

```typescript
interface NotificationDto {
  id: string;
  type: "post_liked" | "post_commented" | "comment_replied";
  actor: {
    id: string;
    name: string;
    avatar: string | null;
    slug: string;
  };
  post: {
    id: string;
    title: string;
    slug: string;
  };
  read: boolean;
  createdAt: Date;
}
```

## Backend Architecture

### Module Structure

```
modules/
  notifications/
    notifications.repository.ts
    notifications.service.ts
    notifications.handler.ts
    notifications.schema.ts
    notifications.mapper.ts
    notifications.emitter.ts    → SSE event broadcasting
```

### Notification Creation

Notifications are created at the **service layer** of the originating action. When a like, comment, or reply happens, the service calls `notificationsService.notify()`:

```typescript
// In interactions service, after toggleLike:
if (liked) {
  await notificationsService.notify({
    recipientId: post.authorId,
    actorId: userId,
    type: "post_liked",
    postId,
  });
}
```

### SSE Broadcasting

A lightweight in-memory event emitter manages SSE connections:

```typescript
// notifications.emitter.ts
const connections = new Map<string, FastifyReply[]>();

function addConnection(userId: string, reply: FastifyReply) { ... }
function removeConnection(userId: string, reply: FastifyReply) { ... }
function broadcast(userId: string, notification: NotificationDto) { ... }
```

When a notification is created:
1. Save to DB
2. Check if recipient has an active SSE connection
3. If yes, push the notification immediately
4. If no, they'll see it next time they load (polling fallback)

### Self-notification Prevention

Always check `actorId !== recipientId` before creating a notification. You don't want to notify someone about their own actions.

## Frontend Design

### Header Bell Icon

- Bell icon in the header (next to theme toggle and profile)
- Red badge with unread count (hidden when 0)
- Click opens notification dropdown

### Notification Dropdown

- List of recent notifications (last 20)
- Each item shows: actor avatar, message, time ago, unread indicator
- Click navigates to the related post
- Clicking marks the notification as read

### SSE Connection

```typescript
// In a client component or context
useEffect(() => {
  const source = new EventSource("/api/notifications/stream");
  source.onmessage = (event) => {
    const notification = JSON.parse(event.data);
    addNotification(notification);
    incrementUnreadCount();
  };
  return () => source.close();
}, []);
```

Connection is established once when the app loads (for authenticated users). Automatically reconnects if disconnected (EventSource handles this natively).

### Notification Messages

| Type | Message |
|------|---------|
| `post_liked` | **{actor.name}** liked your post "{post.title}" |
| `post_commented` | **{actor.name}** commented on "{post.title}" |
| `comment_replied` | **{actor.name}** replied to your comment on "{post.title}" |

## Implementation Order

1. **Schema** — Drizzle schema for `notifications` table + migration + indexes
2. **Shared Types** — `NotificationDto` type
3. **Emitter** — In-memory SSE connection manager
4. **Repository** — CRUD + unread count + cursor pagination
5. **Service** — `notify()` + self-notification prevention
6. **Handler + Route** — List, stream, unread-count, mark-read endpoints
7. **Integration** — Hook into interactions service (like) and comments service (comment, reply)
8. **Frontend** — Bell icon, dropdown, SSE connection, unread badge
