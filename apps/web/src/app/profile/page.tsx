"use client";

import ProtectedRoute from "@/components/protected-route";
import ProfileForm from "@/components/profile/profile-form";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profile & Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and AI configuration
          </p>
        </div>

        <ProfileForm />
      </div>
    </ProtectedRoute>
  );
}
