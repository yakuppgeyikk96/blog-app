export type {
  UserResponseDto,
  RegisterInput,
  LoginInput,
} from "@repo/shared-types";

export interface JwtPayload {
  sub: string;
}
