export type NotificationType =
  | "post_liked"
  | "post_commented"
  | "comment_replied";

export interface NotificationDto {
  id: string;
  type: NotificationType;
  actor: {
    id: string;
    name: string;
    avatar: string | null;
    slug: string;
  };
  post: {
    id: string;
    title: string;
    slug: string;
  } | null;
  read: boolean;
  createdAt: Date;
}
