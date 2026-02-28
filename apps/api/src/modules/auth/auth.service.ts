import * as argon2 from "argon2";
import type { AuthRepository } from "./auth.repository";
import type {
  AuthResponse,
  JwtPayload,
  LoginInput,
  RegisterInput,
} from "./auth.types";
import { toUserResponseDto } from "./auth.mapper";

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
  return {
    async register(input: RegisterInput): Promise<AuthResponse> {
      const existing = await authRepository.findByEmail(input.email);
      if (existing) {
        throw httpErrors.conflict("Email already registered");
      }

      const passwordHash = await argon2.hash(input.password);

      const user = await authRepository.create({
        email: input.email,
        name: input.name,
        passwordHash,
      });

      const token = jwtSign({ sub: user.id });

      return { user: toUserResponseDto(user), token };
    },

    async login(input: LoginInput): Promise<AuthResponse> {
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
