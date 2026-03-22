import { PostCard } from "@/components/post-card";
import { fetchBookmarkedPosts } from "./actions";

export default async function BookmarksPage() {
  const response = await fetchBookmarkedPosts();
  const items = response.data.items;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Bookmarks</h1>
      {items.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {items.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <p className="mt-6 text-muted-foreground">
          No bookmarked posts yet. Bookmark posts to save them here.
        </p>
      )}
    </div>
  );
}
