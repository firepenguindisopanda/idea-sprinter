"use client";

import ProtectedRoute from "@/components/protected-route";
import ProfileForm from "@/components/profile/profile-form";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6 max-w-4xl space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-primary/20 pb-8 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 bg-primary rounded-full" />
              <span className="text-[10px] font-mono text-primary/60 uppercase tracking-widest">System_Access: Admin</span>
            </div>
            <h1 className="text-4xl font-mono font-bold uppercase tracking-tighter">Profile_<span className="text-primary">Settings</span></h1>
            <p className="text-muted-foreground font-sans text-sm italic">
              Configure user authentication protocols and AI model parameters.
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-mono text-muted-foreground uppercase">Entity Ref</div>
            <div className="text-xs font-mono font-bold uppercase tracking-widest">USR_NODE_PROT_7</div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary/10 group-hover:bg-primary/30 transition-colors" />
          <ProfileForm />
        </div>
      </div>
    </ProtectedRoute>
  );
}
