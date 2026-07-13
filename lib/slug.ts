/**
 * Turn a project name into a URL-friendly slug used for /project/[slug] routes.
 * Kept dependency-free so it can be imported from server actions, pages, and
 * client components alike.
 */
export function projectSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "project"
  );
}
