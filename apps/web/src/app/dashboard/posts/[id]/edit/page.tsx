interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Edit Post</h1>
      <p className="mt-4 text-muted-foreground">
        Editing post <code className="text-foreground">{id}</code>
      </p>
    </div>
  );
}
