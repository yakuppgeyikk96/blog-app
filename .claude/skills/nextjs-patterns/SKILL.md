---
name: nextjs-patterns
description: Next.js App Router best practices. Use when writing or reviewing frontend code in apps/web.
user-invokable: false
---

# Next.js App Router Patterns

## Server-First Architecture

The `app/` directory is server-first by design. Treat it as **composition**, not implementation.

- Default to Server Components. Only add `"use client"` when you need interactivity, browser APIs, or React hooks (useState, useEffect, etc.).
- If a component needs `"use client"`, move it to `components/` or `contents/` — keep `app/` clean with only pages, layouts, and thin wrappers.
- Push `"use client"` to the **leaves** of the component tree. A page should be a Server Component that composes client components, not a client component itself.

## RSC Boundaries

### What Can't Cross the Server → Client Boundary
- **Functions** — Never pass functions, event handlers, or callbacks as props from Server to Client Components.
- **Non-serializable values** — Classes, Dates, Maps, Sets, Symbols cannot be passed as props.
- **Server-only modules** — Client Components cannot import modules that use server-only APIs (fs, db, etc.).

### Directive Rules
- `'use client'` — Marks the boundary. Everything imported by this file becomes client-side. Place it at the top of the file, before any imports.
- `'use server'` — Marks a function as a Server Action. Only use on `async` functions that mutate data.
- Keep server-only logic (DB queries, secrets) strictly in Server Components or Server Actions.

### Common Mistakes
```typescript
// BAD — entire page is client-side
"use client";
export default function PostsPage() { ... }

// GOOD — page is server, only interactive parts are client
import { LikeButton } from "@/components/posts/like-button"; // "use client" inside
export default async function PostsPage() {
  const posts = await fetchPosts(); // server-side fetch
  return <PostList posts={posts} likeButton={<LikeButton />} />;
}
```

## Async Patterns (Next.js 15+)

In Next.js 15+, dynamic APIs are async. Always `await` them:

```typescript
// params, searchParams are Promises in Next.js 15+
export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // ...
}

// cookies() and headers() are also async
import { cookies } from "next/headers";
const cookieStore = await cookies();
const token = cookieStore.get("token");
```

## File Structure (apps/web/src)

```
app/
  (auth)/                → Auth routes (grouped, no URL segment)
    login/page.tsx
    register/page.tsx
  (main)/                → Public routes
    layout.tsx           → Layout with header/footer
    page.tsx             → Home / post listing
    posts/
      [slug]/page.tsx    → Single post view
  dashboard/             → Protected routes
    layout.tsx
    page.tsx
    posts/
      new/page.tsx       → Create post
      [id]/edit/page.tsx → Edit post
  layout.tsx             → Root layout (fonts, providers, global styles)
  not-found.tsx
  error.tsx
  loading.tsx
lib/                     → Utilities, API client, helpers
  api.ts                 → Typed fetch wrapper for backend API
  utils.ts               → cn() helper, general utilities
components/              → Reusable components
  ui/                    → shadcn/ui primitives
  posts/                 → Post-related components
  layout/                → Header, Footer, Sidebar
hooks/                   → Custom React hooks
types/                   → Frontend-specific types (not shared DTOs)
```

### Route Groups
- `(auth)` — Login/register pages with minimal layout (no header/footer).
- `(main)` — Public-facing pages with full layout.
- `dashboard` — Authenticated area (protected by middleware).

## Data Fetching

### Where to Fetch
| Method | When to Use |
|--------|-------------|
| Server Component `fetch()` | Read data for page rendering (default choice) |
| Server Action | Mutations (create, update, delete) |
| Route Handler (`route.ts`) | Webhook endpoints, third-party integrations |
| Client-side (SWR/React Query) | Real-time updates, polling, optimistic UI |

### API Client Pattern
```typescript
// lib/api.ts — typed API client
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}
```

### Avoiding Waterfalls
```typescript
// BAD — sequential fetches (waterfall)
const posts = await fetchPosts();
const user = await fetchUser();

// GOOD — parallel fetches
const [posts, user] = await Promise.all([fetchPosts(), fetchUser()]);
```

### Cache & Revalidation
- Use `next: { tags: ['posts'] }` in fetch options for tag-based revalidation.
- Call `revalidateTag('posts')` in Server Actions after mutations.
- Use `revalidatePath('/posts')` when tag-based isn't granular enough.

## Error Handling

### File Conventions
| File | Purpose |
|------|---------|
| `error.tsx` | Catches runtime errors in a route segment. Must be `"use client"`. |
| `global-error.tsx` | Catches errors in the root layout. Must be `"use client"`. |
| `not-found.tsx` | Rendered when `notFound()` is called or route doesn't exist. |
| `loading.tsx` | Instant loading UI shown while route segment loads (uses Suspense). |

### Patterns
- Call `notFound()` from Server Components when data doesn't exist.
- Call `redirect("/login")` when authentication is required.
- `error.tsx` receives `error` and `reset` props — offer a retry button.

## Suspense & Streaming

- Use `loading.tsx` for route-level loading states (auto-wrapped in Suspense).
- Use `<Suspense fallback={<Skeleton />}>` for component-level streaming.
- Wrap independent data-fetching sections separately to stream them in parallel.

```typescript
// Each section streams independently
export default function DashboardPage() {
  return (
    <div>
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>
      <Suspense fallback={<PostsSkeleton />}>
        <RecentPosts />
      </Suspense>
    </div>
  );
}
```

## Metadata & SEO

### Static Metadata
```typescript
export const metadata: Metadata = {
  title: "Blog App",
  description: "A modern blog platform",
};
```

### Dynamic Metadata
```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPost(slug);

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary ?? undefined,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}
```

## Image & Font Optimization

### Images
- Always use `next/image` — never raw `<img>` tags.
- Provide explicit `width` and `height`, or use `fill` with a sized container.
- Use `priority` for above-the-fold images (hero, LCP).
- Configure `remotePatterns` in `next.config.ts` for external images.

### Fonts
- Use `next/font/google` or `next/font/local` — never `<link>` tags.
- Apply fonts via CSS variable + Tailwind for consistency.

```typescript
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// In root layout
<body className={inter.variable}>
```

## Bundle Optimization

- **No barrel files** — Import directly from the source module, not through `index.ts` re-exports.
- **Dynamic imports** — Use `next/dynamic` for heavy components (editors, charts, maps).
- **Tree-shaking** — Import only what you need: `import { Button } from "@/components/ui/button"`, not `import { Button } from "@/components/ui"`.
- **Third-party scripts** — Use `next/script` with `strategy="lazyOnload"` for analytics/tracking.

```typescript
import dynamic from "next/dynamic";

const MarkdownEditor = dynamic(() => import("@/components/markdown-editor"), {
  loading: () => <EditorSkeleton />,
  ssr: false,
});
```

## Forms & Mutations

- Use Server Actions for mutations that don't need real-time client feedback.
- Use client-side fetch for optimistic UI updates.
- Always validate input on both client (UX) AND backend (security).
- Show loading/disabled states during form submission.
- Use `useActionState` for Server Action form state management.

## Middleware

- Use `middleware.ts` at the project root for auth redirects and route protection.
- Keep middleware lightweight — no heavy computation or database queries.
- Use `matcher` config to limit which routes middleware runs on.

## Performance Checklist

- [ ] Pages are Server Components by default
- [ ] `"use client"` only on interactive leaf components
- [ ] No data waterfalls — parallel fetches with `Promise.all()`
- [ ] `next/image` for all images with dimensions
- [ ] `next/link` for all internal navigation
- [ ] `loading.tsx` or `<Suspense>` for every async boundary
- [ ] `generateMetadata` on every public page
- [ ] Dynamic imports for heavy components
- [ ] No barrel file imports
