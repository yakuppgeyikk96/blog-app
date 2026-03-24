import type { User } from "./auth.repository";
import type { UserResponseDto } from "./auth.types";

export function toUserResponseDto(user: User): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    bio: user.bio,
    website: user.website,
    slug: user.slug ?? "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
