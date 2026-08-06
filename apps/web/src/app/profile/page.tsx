"use client";

import ProtectedRoute from "@/components/protected-route";
import ProfileForm from "@/components/profile/profile-form";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6 max-w-4xl space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-primary/25 pb-8 gap-4">
          <div className="space-y-2">
            <span className="label-xs text-primary">Settings</span>
            <h1 className="text-4xl font-bold tracking-[-0.03em]">Profile</h1>
            <p className="text-muted-foreground text-sm">
              Your API keys, role, model choices and tracing.
            </p>
          </div>
        </div>

        <ProfileForm />
      </div>
    </ProtectedRoute>
  );
}
