import { CreatePostButton } from "@/components/dashboard/create-post-button";
import { PostList } from "@/components/dashboard/post-list";
import { fetchMyPosts } from "./actions";

export default async function MyPostsPage() {
  const response = await fetchMyPosts();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">My Posts</h1>
        <CreatePostButton />
      </div>
      <PostList posts={response.data.items} />
    </div>
  );
}
