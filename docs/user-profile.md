# User Profile

## Overview

Users can set up a profile with avatar, bio, and website URL. Each user has a public author page showing their profile and published posts.

## Database Design

### Schema Changes

Add profile fields to the existing `users` table:

```sql
ALTER TABLE "users"
  ADD COLUMN "avatar" text,
  ADD COLUMN "bio" text,
  ADD COLUMN "website" text,
  ADD COLUMN "slug" text UNIQUE;
```

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `avatar` | text | Yes | URL to avatar image on R2 |
| `bio` | text | Yes | Short biography (max 300 chars) |
| `website` | text | Yes | Personal website URL |
| `slug` | text | Yes (unique) | URL-friendly username for public profile |

### Why Add `slug`?

Public profile URLs use `/authors/:slug` instead of `/authors/:id`. The slug is generated from the user's name at registration (same pattern as post slugs) and can be updated from the profile settings.

### Avatar Storage

Avatars are uploaded through the existing upload service but stored under the `avatars/` prefix (not `covers/`). Sharp resizes to max 256x256 and converts to WebP, same as cover images but smaller dimensions.

## API Design

### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/profile` | Required | Get current user's full profile |
| PUT | `/users/profile` | Required | Update profile (bio, website, slug) |
| POST | `/users/avatar` | Required | Upload avatar image |
| GET | `/users/:slug` | Public | Get public author profile |
| GET | `/users/:slug/posts` | Public | Get author's published posts |

### Profile Update

```
PUT /users/profile
Body: { bio?: string, website?: string | null, slug?: string }
→ { user: UserResponseDto }
```

- `slug` must be unique — return 409 if taken.
- `website` must be a valid URL if provided.
- `bio` max 300 characters.

### Avatar Upload

```
POST /users/avatar
Body: FormData (image file)
→ { user: UserResponseDto }
```

Uses the existing upload service with `avatars/` prefix and 256px max width. Updates the user's `avatar` column after upload.

### Public Author Profile

```
GET /users/:slug
→ { author: { id, name, avatar, bio, website, slug, postCount, createdAt } }
```

No email or sensitive data exposed in public profile.

## Type Changes

### UserResponseDto (updated)

```typescript
interface UserResponseDto {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  website: string | null;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### AuthorProfileDto (new)

```typescript
interface AuthorProfileDto {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  website: string | null;
  slug: string;
  postCount: number;
  createdAt: Date;
}
```

### UpdateProfileInput (new)

```typescript
interface UpdateProfileInput {
  bio?: string | null;
  website?: string | null;
  slug?: string;
}
```

## Backend Architecture

### Module Structure

```
modules/
  users/
    users.handler.ts
    users.service.ts
    users.repository.ts
    users.schema.ts
    users.mapper.ts
```

New `users` module — separate from `auth` which handles authentication only. The `users` module handles profile management.

### Repository

```typescript
findBySlug(slug: string): Promise<User | undefined>
findByIdWithPostCount(id: string): Promise<UserWithPostCount | undefined>
findBySlugWithPostCount(slug: string): Promise<UserWithPostCount | undefined>
updateProfile(id: string, data: { bio?, website?, slug?, avatar? }): Promise<User>
isSlugTaken(slug: string, excludeUserId: string): Promise<boolean>
```

### Slug Generation

At registration, auto-generate slug from name (same `generateBaseSlug` + uniqueness check as posts). Users can change their slug from profile settings.

## Frontend Design

### Pages

#### `/authors/:slug` — Public Author Profile
- Avatar (large, with fallback initials)
- Name, bio, website link
- Member since date
- Grid of published posts (reuse PostCard)
- Pagination

#### `/dashboard/profile` — Profile Settings
- Avatar upload (click to change, preview)
- Name (read-only, or editable if desired)
- Bio textarea (character counter, max 300)
- Website URL input
- Slug input (with availability check)
- Save button

### Header Changes
- Profile dropdown avatar shows real image (instead of only initials)
- Post cards and post detail show author avatar next to name

### Linking
- Author names on post cards and detail pages become clickable links to `/authors/:slug`

## Implementation Order

1. **Schema** — Add avatar, bio, website, slug columns to users table + migration
2. **Shared Types** — Update `UserResponseDto`, add `AuthorProfileDto`, `UpdateProfileInput`
3. **Users Module** — Repository, service, handler, schema, mapper
4. **Auth Integration** — Update auth mapper to include new fields, generate slug on register
5. **Upload Integration** — Avatar upload with `avatars/` prefix and 256px resize
6. **Public Author Page** — `/authors/:slug` with post grid
7. **Profile Settings Page** — `/dashboard/profile` with form
8. **UI Integration** — Avatar in header, clickable author names on posts
