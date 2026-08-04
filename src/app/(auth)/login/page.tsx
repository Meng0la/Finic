import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ verifique_email?: string }>;
}) {
  const params = await searchParams;
  return <LoginForm verifiqueEmail={params.verifique_email === "1"} />;
}
