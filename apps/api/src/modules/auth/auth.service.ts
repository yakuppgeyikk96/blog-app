import * as argon2 from "argon2";
import type { AuthRepository } from "./auth.repository";
import type {
  JwtPayload,
  LoginInput,
  RegisterInput,
  UserResponseDto,
} from "./auth.types";
import { toUserResponseDto } from "./auth.mapper";

export interface AuthServiceResult {
  user: UserResponseDto;
  token: string;
}

interface AuthServiceDeps {
  authRepository: AuthRepository;
  jwtSign: (payload: JwtPayload) => string;
  httpErrors: {
    conflict: (message: string) => Error;
    unauthorized: (message: string) => Error;
  };
}

export function createAuthService({
  authRepository,
  jwtSign,
  httpErrors,
}: AuthServiceDeps) {
  function generateBaseSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = generateBaseSlug(name);
    const existingSlugs = await authRepository.findSlugStartingWith(baseSlug);

    if (existingSlugs.length === 0) return baseSlug;

    const slugSet = new Set(existingSlugs.map((r) => r.slug));
    if (!slugSet.has(baseSlug)) return baseSlug;

    let suffix = 1;
    while (slugSet.has(`${baseSlug}-${suffix}`)) suffix++;
    return `${baseSlug}-${suffix}`;
  }

  return {
    async register(input: RegisterInput): Promise<AuthServiceResult> {
      const existing = await authRepository.findByEmail(input.email);
      if (existing) {
        throw httpErrors.conflict("Email already registered");
      }

      const passwordHash = await argon2.hash(input.password);
      const slug = await generateUniqueSlug(input.name);

      const user = await authRepository.create({
        email: input.email,
        name: input.name,
        passwordHash,
        slug,
      });

      const token = jwtSign({ sub: user.id });

      return { user: toUserResponseDto(user), token };
    },

    async login(input: LoginInput): Promise<AuthServiceResult> {
      const user = await authRepository.findByEmail(input.email);
      if (!user) {
        throw httpErrors.unauthorized("Invalid email or password");
      }

      const valid = await argon2.verify(user.passwordHash, input.password);
      if (!valid) {
        throw httpErrors.unauthorized("Invalid email or password");
      }

      const token = jwtSign({ sub: user.id });

      return { user: toUserResponseDto(user), token };
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
