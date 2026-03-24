export function generateBaseSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function generateUniqueSlug(
  input: string,
  findExisting: (baseSlug: string) => Promise<{ slug: string }[]>,
): Promise<string> {
  const baseSlug = generateBaseSlug(input);
  const existingSlugs = await findExisting(baseSlug);

  if (existingSlugs.length === 0) return baseSlug;

  const slugSet = new Set(existingSlugs.map((r) => r.slug));
  if (!slugSet.has(baseSlug)) return baseSlug;

  let suffix = 1;
  while (slugSet.has(`${baseSlug}-${suffix}`)) suffix++;
  return `${baseSlug}-${suffix}`;
}
