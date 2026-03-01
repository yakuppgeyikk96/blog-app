---
name: react-components
description: React component architecture, composition patterns, hooks, and state management. Use when creating, reviewing, or refactoring React components.
user-invokable: false
---

# React Component Architecture

## Component Design Principles

### Single Responsibility
Each component does **one thing**. If you need "and" to describe it, split it.

```
// BAD — fetches data, handles form, renders list, manages modal
PostDashboard

// GOOD — each has one job
PostList          → renders a list of posts
PostForm          → handles post creation form
PostDeleteDialog  → manages delete confirmation
```

### Component Size
- Target **~50-80 lines** per component (JSX included).
- If a component has more than **3 state variables**, it's doing too much — extract a custom hook or split the component.
- If JSX has more than **3 levels of nesting**, extract sub-components.

### Naming
- **Components:** PascalCase, descriptive noun phrases (`PostCard`, `LoginForm`, `UserAvatar`).
- **Files:** kebab-case matching the component (`post-card.tsx`, `login-form.tsx`).
- **One exported component per file.** Tightly coupled sub-components can live in the same file if they're small and not reused elsewhere.

## Props Design

### Keep Props Minimal
A component should receive only the data it needs. Don't pass entire objects when a few fields suffice.

```typescript
// BAD — receives entire post object just to show the title
interface Props {
  post: Post;
}

// GOOD — only what it needs
interface Props {
  title: string;
  slug: string;
}
```

### Props Interface Conventions
- Define props as `interface` in the same file, above the component.
- Name it `{ComponentName}Props` or inline it if simple.
- Always accept `className?: string` on reusable components.
- Use `children: React.ReactNode` for wrapper/layout components.

```typescript
interface PostCardProps {
  title: string;
  summary: string | null;
  slug: string;
  className?: string;
}

export function PostCard({ title, summary, slug, className }: PostCardProps) {
  // ...
}
```

### Discriminated Union Props
When a component has mutually exclusive modes, use a discriminated union instead of optional booleans.

```typescript
// BAD — what happens if both are true?
interface Props {
  isEditing?: boolean;
  isCreating?: boolean;
}

// GOOD — exactly one mode at a time
type Props =
  | { mode: "create" }
  | { mode: "edit"; postId: string };
```

### Avoid Prop Drilling
If a prop passes through 2+ intermediate components untouched, consider:
1. **Composition** — pass the rendered component via children instead of raw data.
2. **Context** — for truly global/shared state (auth, theme).
3. **Restructure** — move the consumer component higher in the tree.

## Composition Patterns

### Children Composition (Default)
The simplest and most common pattern. Use it by default.

```typescript
// Parent composes children — no prop drilling
<Card>
  <CardHeader>
    <CardTitle>{post.title}</CardTitle>
  </CardHeader>
  <CardContent>{post.content}</CardContent>
</Card>
```

### Compound Components
Use when a set of components **must work together** and share implicit state (tabs, accordions, dropdowns).

```typescript
// Consumer API is clean and declarative
<Tabs defaultValue="published">
  <TabsList>
    <TabsTrigger value="published">Published</TabsTrigger>
    <TabsTrigger value="drafts">Drafts</TabsTrigger>
  </TabsList>
  <TabsContent value="published">...</TabsContent>
  <TabsContent value="drafts">...</TabsContent>
</Tabs>
```

shadcn/ui already implements this pattern. **Prefer using shadcn/ui compound components** over building your own.

### Slot Pattern (Render Composition)
Pass pre-rendered JSX as props for flexible layouts without coupling.

```typescript
interface PageHeaderProps {
  title: string;
  action?: React.ReactNode; // slot for any action button
}

export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">{title}</h1>
      {action}
    </div>
  );
}

// Usage — parent controls the action content
<PageHeader
  title="My Posts"
  action={<Button onClick={handleCreate}>New Post</Button>}
/>
```

## Custom Hooks

### When to Extract a Hook
- When a component has **complex state logic** (multiple useState + useEffect).
- When **the same logic** is used in 2+ components.
- When you want to **test logic independently** from the UI.

### Naming & Structure
- Always prefix with `use` (`useAuth`, `usePosts`, `useDebounce`).
- One hook per file in `hooks/` directory.
- File name matches hook name: `hooks/use-auth.ts`.
- Return an object (not array) when returning 3+ values.

```typescript
// hooks/use-posts.ts
export function usePosts(page: number) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // fetch logic...
  }, [page]);

  return { posts, isLoading, error }; // object, not array
}
```

### Rules
- Never call hooks conditionally or inside loops.
- Keep hooks focused — a hook doing 5 things should be split.
- Custom hooks can call other custom hooks.
- Don't create a hook just to wrap a single `useState` — that's over-abstraction.

## State Management

### State Placement Decision Tree

```
Is the state used by only one component?
  → YES: Local state (useState)

Is it shared by a parent and its direct children?
  → YES: Lift state to parent, pass via props

Is it shared across distant components?
  → YES: Is it server data (posts, users)?
    → YES: Fetch in Server Components, or use SWR/React Query
    → NO: Is it UI state (theme, sidebar open)?
      → YES: React Context
      → NO: Consider Zustand for complex client state
```

### Local State Rules
- Initialize with a sensible default, not `undefined` when a value is always present.
- Use **functional updates** when new state depends on previous: `setCount(c => c + 1)`.
- Group related state in an object instead of multiple `useState` calls when they always change together.

### Context Guidelines
- Create context only for truly shared, cross-cutting state (auth user, theme, locale).
- Keep context values small — don't put an entire app state in one context.
- Split contexts by domain: `AuthContext`, `ThemeContext` — not one `AppContext`.
- Memoize the context value to prevent unnecessary re-renders.

```typescript
// contexts/auth-context.tsx
interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
```

## Component File Organization

### Feature-Based Structure
Group components by feature, not by type.

```
components/
  posts/
    post-card.tsx         → Single post card
    post-list.tsx         → List of post cards
    post-form.tsx         → Create/edit form
    post-delete-dialog.tsx
  layout/
    header.tsx
    footer.tsx
    sidebar.tsx
  ui/                     → shadcn/ui primitives (auto-generated)
    button.tsx
    card.tsx
    ...
```

### Colocation Rules
- Component + its types → same file.
- Component + its specific sub-components → same file (if small, <30 lines each).
- Component + its hook → separate files (hook is reusable).
- Component + its styles → Tailwind in JSX (no separate CSS file).

## Error Boundaries

- Use `error.tsx` at route segment level (Next.js built-in).
- For component-level errors, wrap with a custom Error Boundary.
- Error boundaries must be `"use client"` components.
- Always provide a **recovery action** (retry button, link to home).

```typescript
"use client";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
```

## Anti-Patterns to Avoid

- **God components** — Components over 200 lines that do everything. Split them.
- **Prop drilling 3+ levels** — Use composition or context instead.
- **Business logic in components** — Extract to hooks or utility functions.
- **Inline object/array literals in JSX props** — Creates new references every render, breaks memoization.
- **useEffect for derived state** — Use `useMemo` or compute directly during render.
- **State for values computable from props** — Derive, don't sync.

```typescript
// BAD — derived state in useEffect
const [fullName, setFullName] = useState("");
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// GOOD — compute during render
const fullName = `${firstName} ${lastName}`;
```
