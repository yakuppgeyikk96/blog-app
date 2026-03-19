"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

export function BlurImage({ className, alt, ...props }: ImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  const isFill = props.fill === true;

  return (
    <>
      {isLoading && (
        <div
          className={cn(
            "animate-pulse bg-muted",
            isFill ? "absolute inset-0 z-10" : "absolute inset-0",
          )}
        />
      )}
      <Image
        {...props}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className,
        )}
        onLoad={() => setIsLoading(false)}
      />
    </>
  );
}
