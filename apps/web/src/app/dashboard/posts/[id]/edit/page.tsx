import { PostEditorLoader } from "@/components/editor/post-editor-loader";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;

  return <PostEditorLoader postId={id} />;
}
