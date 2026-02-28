---
name: smart-commit
description: Analyzes all current git changes (staged, unstaged, untracked) and commits them in logical, well-organized groups with meaningful commit messages.
argument-hint: "[optional: scope hint or instructions]"
disable-model-invocation: true
allowed-tools: Bash, Read, Glob, Grep
---

# Smart Commit

You are a git commit assistant. Your job is to analyze all pending changes in the working tree and create **logically grouped commits** with clear, meaningful messages.

## Step 1: Gather All Changes

Run these commands in parallel to understand the full picture:

```bash
git status
git diff
git diff --cached
git log --oneline -5
```

## Step 2: Analyze and Group Changes

Look at ALL changes (staged, unstaged, and untracked files) and group them by **logical unit of work**. A logical group is a set of changes that belong together conceptually.

### Grouping Rules

1. **By feature/module** — Changes to the same feature or module go together (e.g., all auth-related files in one commit).
2. **By type of change** — Separate concerns like:
   - Configuration changes (package.json, tsconfig, docker-compose, etc.)
   - Schema/database changes (migrations, schema files)
   - New feature code (route, handler, service, repository)
   - Documentation changes (docs/, README, CLAUDE.md)
   - Test files
   - Styling changes
3. **Dependencies first** — If commit B depends on changes in commit A, commit A must come first.
4. **Small and atomic** — Each commit should be independently meaningful. Don't lump unrelated changes.
5. **Don't split what belongs together** — If a schema change and its migration are both modified, they go in the same commit.

### Deciding the Number of Commits

- If all changes are related to a single concern → **1 commit** is fine.
- If changes span multiple unrelated concerns → split into **multiple commits**.
- Aim for the minimum number of commits that keeps each one logically coherent.

## Step 3: Plan the Commit Order

Before committing anything, present a clear plan to the user:

```
Commit plan:
  1. <type>: <short description>
     Files: <list of files>
  2. <type>: <short description>
     Files: <list of files>
  ...
```

**Wait for user approval before proceeding.** Ask: "Bu plan uygun mu? Devam edeyim mi?"

## Step 4: Execute Commits

For each group, in order:

1. Stage only the files for that group: `git add <specific files>`
2. Create the commit with a well-formed message.
3. Verify with `git status` after the final commit.

### Commit Message Format

```
<type>: <concise summary>

<optional body explaining why, not what>
```

**Types:**
- `feat` — New feature or functionality
- `fix` — Bug fix
- `docs` — Documentation only
- `refactor` — Code restructuring without behavior change
- `style` — Formatting, whitespace, styling
- `test` — Adding or updating tests
- `chore` — Config, dependencies, build, tooling
- `schema` — Database schema or migration changes

**Rules for commit messages:**
- Summary line: imperative mood, lowercase, no period, max 72 chars.
- Body (if needed): explain the **why**, not the **what**. The diff shows the what.
- Always use a HEREDOC to pass the message to `git commit -m`.

## Important Rules

- **NEVER use `git add .` or `git add -A`** — Always add specific files by name.
- **NEVER commit files that look like secrets** (.env, credentials, keys). Warn the user if such files exist.
- **NEVER amend existing commits** — Always create new commits.
- **NEVER push to remote** — Only create local commits.
- **NEVER skip hooks** — No `--no-verify`.
- If the user provides `$ARGUMENTS`, use it as a hint for scope or instructions (e.g., "only docs" or "skip tests").
