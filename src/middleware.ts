import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Usa a convenção antiga `middleware.ts` (em vez do `proxy.ts` do Next.js 16)
// porque o adaptador OpenNext para Cloudflare Workers ainda não suporta o
// runtime Node.js forçado do proxy.ts — middleware.ts roda em Edge runtime,
// que o OpenNext suporta. Reverter para proxy.ts quando o adaptador atualizar.
export function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
