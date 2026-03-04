import { cookies } from "next/headers";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

export async function serverApi<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...options?.headers,
      Cookie: cookieHeader,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? res.statusText);
  }

  return res.json() as Promise<T>;
}
