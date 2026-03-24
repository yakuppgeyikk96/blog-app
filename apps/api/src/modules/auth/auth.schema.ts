import { Type, type Static } from "@sinclair/typebox";

const RegisterBody = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 8 }),
  name: Type.String({ minLength: 1 }),
});

const LoginBody = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 8 }),
});

const UserResponseSchema = Type.Object({
  id: Type.String(),
  email: Type.String(),
  name: Type.String(),
  avatar: Type.Union([Type.String(), Type.Null()]),
  bio: Type.Union([Type.String(), Type.Null()]),
  website: Type.Union([Type.String(), Type.Null()]),
  slug: Type.String(),
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.String({ format: "date-time" }),
});

const AuthDataSchema = Type.Object({
  user: UserResponseSchema,
});

const AuthResponseSchema = Type.Object({
  success: Type.Literal(true),
  data: AuthDataSchema,
});

export type RegisterBodyType = Static<typeof RegisterBody>;
export type LoginBodyType = Static<typeof LoginBody>;

export const registerSchema = {
  body: RegisterBody,
  response: { 201: AuthResponseSchema },
};

export const loginSchema = {
  body: LoginBody,
  response: { 200: AuthResponseSchema },
};

const LogoutResponseSchema = Type.Object({
  success: Type.Literal(true),
});

export const logoutSchema = {
  response: { 200: LogoutResponseSchema },
};

export const meSchema = {
  response: { 200: AuthResponseSchema },
};
