export interface UserResponseDto {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  website: string | null;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserResponseDto;
}

export interface AuthorProfileDto {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  website: string | null;
  slug: string;
  postCount: number;
  createdAt: Date;
}

export interface UpdateProfileInput {
  bio?: string | null;
  website?: string | null;
  slug?: string;
}
