# Search

## Overview

Full-text search for blog posts using PostgreSQL's built-in text search capabilities. Users can search posts by title, summary, and content.

## PostgreSQL Search Strategies Comparison

| Strategy | Mechanism | Index | Strengths | Weaknesses |
|---|---|---|---|---|
| **LIKE / ILIKE** | Pattern matching (`%term%`) | None (or trigram) | Simple, no setup | No ranking, no stemming, slow on large data |
| **Full-Text Search** | tsvector / tsquery | GIN | Stemming, ranking, language support, fast with index | No fuzzy/typo tolerance |
| **pg_trgm (Trigram)** | Character n-gram similarity | GIN / GiST | Fuzzy matching, typo tolerance | No stemming, ranking is similarity-based not relevance-based |
| **Regex (~, ~\*)** | Regular expressions | None | Maximum flexibility | Slowest, no ranking, no index support |

## Chosen Strategy: Full-Text Search (tsvector / tsquery)

Full-text search is the best fit for a blog application:

- **Stemming** — Searching "running" also matches "run", "runs", "ran".
- **Ranking** — Results are ordered by relevance using `ts_rank`.
- **Performance** — GIN index makes searches fast even with large datasets.
- **Multi-field search** — Title, summary, and content are combined into a single searchable vector with different weights.
- **No extra infrastructure** — Everything runs inside PostgreSQL.

Trigram (pg_trgm) may be added later as a complement for typo tolerance, but is not in scope for the initial implementation.

## Database Design

### Search Vector Column

Add a generated `search_vector` column to the `posts` table:

```sql
ALTER TABLE posts
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(content, '')), 'C')
) STORED;
```

### Weights

| Field | Weight | Rationale |
|---|---|---|
| `title` | A (highest) | Most important — a title match is the strongest signal |
| `summary` | B | Secondary — summary describes the post |
| `content` | C | Lowest — content matches are still relevant but less precise |

### GIN Index

```sql
CREATE INDEX idx_posts_search ON posts USING GIN (search_vector);
```

### Drizzle Migration

Implement the above as a Drizzle migration using `sql` template literals, since Drizzle doesn't natively support generated tsvector columns.

## API Design

### Endpoint

Extend the existing `GET /posts` endpoint with a `q` query parameter:

```
GET /posts?q=react+hooks
GET /posts?q=typescript&tag=backend
GET /posts?page=1&limit=10&q=api+design
```

### Query Logic

```sql
SELECT *, ts_rank(search_vector, query) AS rank
FROM posts, plainto_tsquery('english', :q) query
WHERE search_vector @@ query
ORDER BY rank DESC, created_at DESC;
```

- Use `plainto_tsquery` (not `to_tsquery`) — it handles user input safely without requiring boolean syntax.
- When `q` is empty or not provided, skip the search filter entirely (return all posts as before).
- Search combines with existing filters (tag, pagination).

### Response

No changes to the response DTO. The ranking is used only for ordering, not exposed to the client.

## Frontend Design

### Search Input

Add a search input above the post list on the homepage. The input should:

- Use **debounced** updates (300ms) to avoid excessive API calls on every keystroke.
- Sync with the URL query parameter `?q=` so the search state persists on page reload.
- Work alongside the existing tag filter (`?q=react&tag=frontend`).
- Show a clear/reset button when a search term is active.

### URL State

```
/                           → all posts
/?q=react                   → search for "react"
/?tag=frontend              → filter by tag
/?q=react&tag=frontend      → search + tag filter
```

### UX Considerations

- Show "No results found" message when search returns empty.
- Preserve search term in input when navigating back to the homepage.

## Implementation Order

1. **Database** — Migration to add `search_vector` column and GIN index.
2. **Repository** — Add search condition to the posts query.
3. **Service / Handler / Route** — Accept `q` parameter, pass to repository.
4. **Frontend** — Search input component, URL state management, debouncing.

## Future Enhancements

- **Trigram search (pg_trgm)** — Add fuzzy matching for typo tolerance as a fallback when FTS returns no results.
- **Search highlighting** — Use `ts_headline` to highlight matching terms in results.
- **Search suggestions** — Autocomplete based on existing post titles/tags.
