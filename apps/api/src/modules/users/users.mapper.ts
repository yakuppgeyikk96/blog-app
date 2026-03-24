import type { User } from "./users.repository";
import type { UserWithPostCount } from "./users.repository";
import type { UserResponseDto, AuthorProfileDto } from "@repo/shared-types";

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

export function toAuthorProfileDto(user: UserWithPostCount): AuthorProfileDto {
  return {
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    bio: user.bio,
    website: user.website,
    slug: user.slug ?? "",
    postCount: user.postCount,
    createdAt: user.createdAt,
  };
}
