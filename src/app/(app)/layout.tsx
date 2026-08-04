import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/layout/AppNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
    redirect("/mfa");
  }

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const hasVerifiedFactor = factors?.totp.some((f) => f.status === "verified");
  if (!hasVerifiedFactor) {
    redirect("/mfa/enroll");
  }

  return (
    <div className="flex flex-1 flex-col bg-canvas">
      <AppNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
