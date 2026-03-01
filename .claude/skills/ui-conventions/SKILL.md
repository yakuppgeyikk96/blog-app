---
name: ui-conventions
description: Tailwind CSS and shadcn/ui conventions. Use when writing or reviewing UI components and styles.
user-invokable: false
---

# UI Conventions — Tailwind CSS + shadcn/ui

## Component Structure
- Use shadcn/ui as the base component library — do not install other UI libraries.
- Customize shadcn/ui components via their source files in `components/ui/`.
- Build feature components by composing shadcn/ui primitives.

## Tailwind Usage
- Use Tailwind utility classes directly — avoid custom CSS files.
- Use `cn()` helper (from `lib/utils.ts`) for conditional class merging.
- Keep class lists readable — break long class strings across lines if needed.
- Use design tokens from the theme (e.g., `text-primary`, `bg-muted`) over hardcoded colors.

```typescript
import { cn } from '@/lib/utils';

interface CardProps {
  className?: string;
  featured?: boolean;
}

export function PostCard({ className, featured }: CardProps) {
  return (
    <div className={cn(
      'rounded-lg border p-4',
      featured && 'border-primary bg-primary/5',
      className,
    )}>
      {/* content */}
    </div>
  );
}
```

## Component Patterns
- Accept `className` prop on all reusable components for extensibility.
- Use `forwardRef` when wrapping native elements.
- Keep components small — extract sub-components when a component exceeds ~80 lines.
- Colocate component-specific types in the same file.

## Responsive Design
- Design mobile-first — start with base styles, add breakpoint modifiers.
- Use Tailwind breakpoints consistently: `sm:`, `md:`, `lg:`.
- Test layouts at common breakpoints.

## Accessibility
- Use semantic HTML elements (`<button>`, `<nav>`, `<main>`, `<article>`).
- All interactive elements must be keyboard accessible.
- Add `aria-label` to icon-only buttons.
- Maintain sufficient color contrast ratios.
- Use shadcn/ui components — they handle most a11y concerns.

## Dark Mode
- Use Tailwind's `dark:` variant for dark mode styles.
- Rely on CSS variables defined in the theme for colors.
- Never hardcode color values — use semantic tokens (`text-foreground`, `bg-background`).

## Icons
- Use a single icon library (e.g., `lucide-react`).
- Size icons consistently using Tailwind width/height classes.

## Images & Links
- Always use `next/image` — never raw `<img>` tags. Provide `width`/`height` or use `fill` with a sized container.
- Use `priority` prop on above-the-fold images (hero, LCP candidates).
- Always use `next/link` for internal navigation — never raw `<a>` tags for same-app routes.

## Forms
- Compose forms from shadcn/ui primitives (`Input`, `Button`, `Label`, `Textarea`, `Select`).
- Use Server Actions for form submissions when possible — simpler than client-side fetch.
- For client-side forms, use `useActionState` or a form library with validation.
- Always show loading/disabled states during submission.
- Display inline validation errors next to the relevant field, not in a generic toast.

## Performance
- Avoid unnecessary wrapper `<div>` elements.
- Use `React.memo` only when profiling shows re-render issues — don't premature optimize.
- Lazy load components that are below the fold or in modals.
