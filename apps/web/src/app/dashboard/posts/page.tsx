import { CreatePostButton } from "@/components/dashboard/create-post-button";

export default function MyPostsPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">My Posts</h1>
        <CreatePostButton />
      </div>
      <p className="mt-4 text-muted-foreground">Posts will be listed here.</p>
    </div>
  );
}
