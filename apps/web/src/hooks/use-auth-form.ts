import { useState } from "react";

interface UseAuthFormOptions<T> {
  onSubmit: (data: T) => Promise<void>;
}

export function useAuthForm<T>({ onSubmit }: UseAuthFormOptions<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: T) {
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return { isSubmitting, error, handleSubmit };
}
