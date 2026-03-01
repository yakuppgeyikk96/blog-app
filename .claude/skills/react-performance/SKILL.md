---
name: react-performance
description: React and Next.js performance optimization rules. Use when writing components, implementing data fetching, reviewing performance, or optimizing load times.
user-invokable: false
---

# React Performance Optimization

Rules organized by impact priority. Apply the highest-priority rules first — they yield the biggest gains.

## CRITICAL: Eliminating Request Waterfalls

Sequential data fetches are the #1 performance killer in React apps.

### Parallelize Independent Fetches
```typescript
// BAD — waterfall: user waits for posts, THEN waits for categories
const posts = await fetchPosts();
const categories = await fetchCategories();

// GOOD — parallel: both requests start at the same time
const [posts, categories] = await Promise.all([
  fetchPosts(),
  fetchCategories(),
]);
```

### Move Awaits Into Branches
```typescript
// BAD — always waits for both, even when user is logged out
const user = await getUser();
const posts = await getPosts();
if (!user) return <LoginPage />;

// GOOD — only fetch what's needed
const user = await getUser();
if (!user) return <LoginPage />;
const posts = await getPosts();
```

### Stream with Suspense
Wrap independent data sections in separate `<Suspense>` boundaries so they load and render independently without blocking each other.

```typescript
export default function Page() {
  return (
    <>
      <Suspense fallback={<HeaderSkeleton />}>
        <Header />          {/* fetches user data */}
      </Suspense>
      <Suspense fallback={<PostsSkeleton />}>
        <PostList />         {/* fetches posts — doesn't wait for Header */}
      </Suspense>
    </>
  );
}
```

## CRITICAL: Bundle Size Optimization

### Import Directly — No Barrel Files
```typescript
// BAD — imports everything from the barrel, tree-shaking may fail
import { Button, Card } from "@/components/ui";

// GOOD — direct imports, only what's needed enters the bundle
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
```

### Dynamic Import for Heavy Components
```typescript
import dynamic from "next/dynamic";

// Editor (~200KB) is only loaded when needed
const MarkdownEditor = dynamic(
  () => import("@/components/markdown-editor"),
  { loading: () => <EditorSkeleton />, ssr: false },
);
```

### Defer Third-Party Scripts
```typescript
import Script from "next/script";

// Load analytics after hydration, not during initial render
<Script src="https://analytics.example.com/script.js" strategy="lazyOnload" />
```

### Minimize `"use client"` Surface
Every `"use client"` component and its entire dependency tree is sent to the browser. Extract the minimal interactive part into a small client component and keep the rest server-rendered.

## HIGH: Server-Side Performance

### Deduplicate with `React.cache()`
```typescript
import { cache } from "react";

// Called in multiple Server Components? Only one actual DB query per request.
export const getUser = cache(async (id: string) => {
  return db.query.users.findFirst({ where: eq(users.id, id) });
});
```

### Parallel Data Fetching in Layouts
Layouts and pages fetch data independently. If both need the same data, use `React.cache()` to deduplicate. If they need different data, they automatically fetch in parallel (no waterfall).

### Don't Fetch in Layouts What Pages Need
Layouts render before pages. If you fetch data in a layout and pass it down, you create a waterfall. Let each segment fetch its own data.

## MEDIUM-HIGH: Client-Side Data Fetching

### Use SWR or React Query for Client Fetches
```typescript
// Automatic deduplication, caching, revalidation, and error handling
const { data, error, isLoading } = useSWR("/api/posts", fetcher);
```

### Clean Up Event Listeners
```typescript
useEffect(() => {
  const handler = () => { /* ... */ };
  window.addEventListener("scroll", handler, { passive: true });
  return () => window.removeEventListener("scroll", handler);
}, []);
```

### Use Passive Listeners for Scroll/Touch
Always add `{ passive: true }` for scroll, touchstart, and touchmove listeners. This tells the browser the handler won't call `preventDefault()`, enabling smoother scrolling.

## MEDIUM: Re-render Optimization

### Extract Expensive Children
```typescript
// BAD — entire component re-renders when count changes
function Page() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <ExpensiveChart data={staticData} />
    </div>
  );
}

// GOOD — ExpensiveChart is in a separate component, doesn't re-render
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

function Page() {
  return (
    <div>
      <Counter />
      <ExpensiveChart data={staticData} />
    </div>
  );
}
```

### Use Primitive Dependencies in Effects
```typescript
// BAD — runs every render because object reference changes
useEffect(() => { /* ... */ }, [user]);

// GOOD — only runs when the actual value changes
useEffect(() => { /* ... */ }, [user.id]);
```

### Use `startTransition` for Non-Urgent Updates
```typescript
import { startTransition } from "react";

function handleSearch(query: string) {
  // Urgent: update the input immediately
  setInputValue(query);

  // Non-urgent: update filtered results without blocking the input
  startTransition(() => {
    setFilteredResults(filterPosts(query));
  });
}
```

## MEDIUM: Rendering Performance

### Prefer CSS Animations Over JS
Use CSS `transform` and `opacity` for animations — they run on the GPU compositor thread and don't cause layout recalculations. Avoid animating `width`, `height`, `top`, `left`.

### Use `content-visibility` for Long Lists
```css
.post-card {
  content-visibility: auto;
  contain-intrinsic-size: 0 300px;
}
```
This tells the browser to skip rendering off-screen items, significantly improving initial render time for long lists.

### Conditional Rendering
```typescript
// BAD — renders falsy value as "0" in the DOM
{count && <Badge count={count} />}

// GOOD — explicit boolean check
{count > 0 && <Badge count={count} />}

// ALSO GOOD — ternary for clarity
{count > 0 ? <Badge count={count} /> : null}
```

## LOW-MEDIUM: JavaScript Performance

### Use Map for Frequent Lookups
```typescript
// BAD — O(n) lookup on every render
const user = users.find(u => u.id === targetId);

// GOOD — O(1) lookup
const userMap = new Map(users.map(u => [u.id, u]));
const user = userMap.get(targetId);
```

### Batch DOM Reads and Writes
Don't interleave DOM reads (`getBoundingClientRect`) and writes (`style.height = ...`). Group all reads first, then writes, to avoid layout thrashing.

### Cache Property Access in Loops
```typescript
// BAD — items.length evaluated every iteration
for (let i = 0; i < items.length; i++) { /* ... */ }

// GOOD — cached
for (let i = 0, len = items.length; i < len; i++) { /* ... */ }

// BEST — use for...of or .forEach() for readability
for (const item of items) { /* ... */ }
```

## Quick Reference Checklist

| Priority | Rule | Impact |
|----------|------|--------|
| CRITICAL | No sequential awaits — use `Promise.all()` | Eliminates waterfalls |
| CRITICAL | Direct imports, no barrel files | Smaller bundles |
| CRITICAL | `dynamic()` for heavy components | Faster initial load |
| CRITICAL | Minimal `"use client"` surface | Less client JS |
| HIGH | `React.cache()` for shared server fetches | No duplicate queries |
| MEDIUM | Separate `<Suspense>` per data section | Parallel streaming |
| MEDIUM | Extract state into small components | Fewer re-renders |
| MEDIUM | Primitive deps in useEffect | Correct effect behavior |
| MEDIUM | CSS transforms for animations | Smoother animations |
| LOW | Map for O(1) lookups | Faster data access |
