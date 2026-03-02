export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const headers: HeadersInit = options?.body
    ? { "Content-Type": "application/json" }
    : {};

  const res = await fetch(`/api${path}`, {
    headers,
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(
      res.status,
      body?.message ?? res.statusText,
    );
  }

  return res.json() as Promise<T>;
}
