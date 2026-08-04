// Este ambiente de desenvolvimento fica atrás de um proxy corporativo
// (HTTP_PROXY/HTTPS_PROXY). O fetch global do Node (undici) não respeita
// essas variáveis automaticamente, o que quebra toda chamada ao Supabase
// feita em Server Actions/Server Components. Configura o dispatcher global
// para rotear pelo proxy quando ele estiver definido.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (!proxyUrl) return;

  const { setGlobalDispatcher, ProxyAgent } = await import("undici");
  setGlobalDispatcher(new ProxyAgent(proxyUrl));
}
