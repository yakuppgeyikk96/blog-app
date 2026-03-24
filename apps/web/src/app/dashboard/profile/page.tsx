"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { api, ApiError } from "@/lib/api";
import { getInitials } from "@/lib/format";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { UserResponseDto } from "@repo/shared-types";
import { Camera } from "lucide-react";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bio, setBio] = useState(user?.bio ?? "");
  const [website, setWebsite] = useState(user?.website ?? "");
  const [slug, setSlug] = useState(user?.slug ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (!user) return null;

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api<{
        success: true;
        data: { user: UserResponseDto };
      }>("/users/avatar", { method: "POST", body: formData });

      setUser(res.data.user);
      toast.success("Avatar updated");
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await api<{
        success: true;
        data: { user: UserResponseDto };
      }>("/users/profile", {
        method: "PUT",
        body: JSON.stringify({
          bio: bio || null,
          website: website || null,
          slug: slug || undefined,
        }),
      });

      setUser(res.data.user);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to update profile",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>

      <div className="mt-8 max-w-lg space-y-8">
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="size-20">
              {user.avatar && (
                <AvatarImage src={user.avatar} alt={user.name} />
              )}
              <AvatarFallback className="text-xl">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -right-1 -bottom-1 rounded-full bg-primary p-1.5 text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
            >
              <Camera className="size-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slug">Username</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="your-username"
            />
            <p className="text-xs text-muted-foreground">
              Your public profile URL: /authors/{slug || "..."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              maxLength={300}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {bio.length}/300
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yoursite.com"
            />
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </div>
    </div>
  );
}
