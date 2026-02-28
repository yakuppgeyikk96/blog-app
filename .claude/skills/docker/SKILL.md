---
name: docker
description: Manage Docker Compose services (up, down, rebuild).
user-invokable: true
argument-hint: "[up|down|rebuild]"
---

# Docker Compose Management

Based on the argument provided, run the appropriate docker compose command from the project root (`/Users/yakupgeyik/Projects/blog-app`).

## Commands

- **up** — Start all services in detached mode and follow logs.
  ```
  docker compose up -d && docker compose logs -f
  ```

- **down** — Stop and remove all services.
  ```
  docker compose down
  ```

- **rebuild** — Rebuild all images from scratch and start services.
  ```
  docker compose down && docker compose build --no-cache && docker compose up -d && docker compose logs -f
  ```

If no argument is provided, ask the user which action they want to perform: up, down, or rebuild.
