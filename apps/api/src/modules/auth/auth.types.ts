export type {
  UserResponseDto,
  RegisterInput,
  LoginInput,
  AuthResponse,
} from "@repo/shared-types";

export interface JwtPayload {
  sub: string;
}
