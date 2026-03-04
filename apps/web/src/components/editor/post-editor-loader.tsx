"use client";

import dynamic from "next/dynamic";

const PostEditor = dynamic(
  () =>
    import("@/components/editor/post-editor").then((mod) => mod.PostEditor),
  { ssr: false },
);

interface PostEditorLoaderProps {
  postId: string;
}

export function PostEditorLoader({ postId }: PostEditorLoaderProps) {
  return <PostEditor postId={postId} />;
}
