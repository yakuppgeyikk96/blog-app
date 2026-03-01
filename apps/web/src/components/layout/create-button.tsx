import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CreateButton() {
  return (
    <Button asChild>
      <Link href="/dashboard/posts/new">
        <Plus className="size-4" />
        Create
      </Link>
    </Button>
  );
}
