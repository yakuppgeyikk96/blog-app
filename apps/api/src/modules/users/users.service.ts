import type { UsersRepository } from "./users.repository";
import type { UploadsService } from "../uploads/uploads.service";
import type {
  UserResponseDto,
  AuthorProfileDto,
  UpdateProfileInput,
} from "@repo/shared-types";
import { toUserResponseDto, toAuthorProfileDto } from "./users.mapper";

interface UsersServiceDeps {
  usersRepository: UsersRepository;
  uploadsService: UploadsService;
  httpErrors: {
    notFound: (message: string) => Error;
    conflict: (message: string) => Error;
    badRequest: (message: string) => Error;
  };
}

const MAX_BIO_LENGTH = 300;
const AVATAR_MAX_WIDTH = 256;

export function createUsersService({
  usersRepository,
  uploadsService,
  httpErrors,
}: UsersServiceDeps) {
  function generateBaseSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function generateUniqueSlug(
    name: string,
    excludeUserId?: string,
  ): Promise<string> {
    const baseSlug = generateBaseSlug(name);
    const existingSlugs = await usersRepository.findSlugStartingWith(
      baseSlug,
      excludeUserId,
    );

    if (existingSlugs.length === 0) return baseSlug;

    const slugSet = new Set(existingSlugs.map((r) => r.slug));
    if (!slugSet.has(baseSlug)) return baseSlug;

    let suffix = 1;
    while (slugSet.has(`${baseSlug}-${suffix}`)) suffix++;
    return `${baseSlug}-${suffix}`;
  }

  return {
    async getProfile(userId: string): Promise<UserResponseDto> {
      const user = await usersRepository.findById(userId);
      if (!user) {
        throw httpErrors.notFound("User not found");
      }

      return toUserResponseDto(user);
    },

    async updateProfile(
      userId: string,
      input: UpdateProfileInput,
    ): Promise<UserResponseDto> {
      if (input.bio !== undefined && input.bio !== null && input.bio.length > MAX_BIO_LENGTH) {
        throw httpErrors.badRequest(`Bio must be ${MAX_BIO_LENGTH} characters or less`);
      }

      if (input.slug !== undefined) {
        const slugValue = generateBaseSlug(input.slug);
        if (!slugValue) {
          throw httpErrors.badRequest("Invalid slug");
        }

        const taken = await usersRepository.isSlugTaken(slugValue, userId);
        if (taken) {
          throw httpErrors.conflict("This slug is already taken");
        }

        input = { ...input, slug: slugValue };
      }

      const updated = await usersRepository.updateProfile(userId, input);
      if (!updated) {
        throw httpErrors.notFound("User not found");
      }

      return toUserResponseDto(updated);
    },

    async uploadAvatar(
      userId: string,
      mimetype: string,
      filename: string,
      buffer: Buffer,
    ): Promise<UserResponseDto> {
      const { url } = await uploadsService.uploadImage(
        mimetype,
        filename,
        buffer,
        { prefix: "avatars", maxWidth: AVATAR_MAX_WIDTH },
      );

      const updated = await usersRepository.updateProfile(userId, { avatar: url });
      if (!updated) {
        throw httpErrors.notFound("User not found");
      }

      return toUserResponseDto(updated);
    },

    async getAuthorProfile(slug: string): Promise<AuthorProfileDto> {
      const user = await usersRepository.findBySlugWithPostCount(slug);
      if (!user) {
        throw httpErrors.notFound("Author not found");
      }

      return toAuthorProfileDto(user);
    },
  };
}

export type UsersService = ReturnType<typeof createUsersService>;
