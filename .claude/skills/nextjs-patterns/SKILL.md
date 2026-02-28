---
name: nextjs-patterns
description: Next.js App Router best practices. Use when writing or reviewing frontend code in apps/web.
user-invokable: false
---

# Next.js App Router Patterns

## Server vs Client Components
- Default to Server Components. Only add `"use client"` when you need interactivity, browser APIs, or React hooks.
- Never pass functions as props from server to client components.
- Keep client components small and push them to the leaves of the component tree.

## File Structure (apps/web)
```
app/
  (auth)/              → Auth-related routes (grouped, no URL segment)
    login/page.tsx
    register/page.tsx
  (main)/              → Public routes
    page.tsx           → Home / post listing
    posts/[slug]/page.tsx
  dashboard/           → Protected routes
    page.tsx
    layout.tsx
  layout.tsx           → Root layout
  not-found.tsx
  error.tsx
  loading.tsx
lib/                   → Utilities, API client, helpers
  api.ts               → Typed API client for backend
  utils.ts
components/            → Reusable components
  ui/                  → shadcn/ui components
  posts/               → Post-related components
  layout/              → Header, Footer, Sidebar
hooks/                 → Custom React hooks
types/                 → Frontend-specific types
```

## Data Fetching
- Fetch data in Server Components using `async/await` directly.
- Use the backend REST API via a typed API client — never access the database directly from the frontend.
- Implement proper loading states with `loading.tsx` or `Suspense`.
- Use `revalidatePath` / `revalidateTag` for cache invalidation after mutations.

```typescript
// lib/api.ts — typed API client
async function fetchPosts(): Promise<Post[]> {
  const res = await fetch(`${API_URL}/posts`, { next: { tags: ['posts'] } });
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}
```

## Error Handling
- Use `error.tsx` boundaries at route segment level.
- Use `not-found.tsx` with `notFound()` for 404 cases.
- Show user-friendly error messages, never expose raw errors.

## SEO
- Use `generateMetadata` for dynamic meta tags on each page.
- Use semantic HTML (`<article>`, `<header>`, `<main>`, `<nav>`).
- Add `alt` text to all images.

## Performance
- Use `next/image` for all images with explicit `width` and `height`.
- Use `next/link` for all internal navigation.
- Lazy load heavy components with `dynamic()`.
- Avoid large client-side bundles — keep `"use client"` components minimal.

## Forms & Mutations
- Use Server Actions or call the backend API from client components.
- Always validate input on the client (UX) AND on the backend (security).
- Show loading/disabled states during form submission.
