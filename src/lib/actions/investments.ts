"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { currentMonthRef, monthRange, monthTotals } from "@/lib/finance";
import type { ActionState } from "@/lib/actions/accounts";
import type {
  Experiencia,
  FonteConsultada,
  InvestmentSuggestionPayload,
  Json,
  PerfilRisco,
  Transaction,
} from "@/types/database";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// groq/compound tem busca na internet embutida (até 10 chamadas de ferramenta
// por requisição) — é mais lento que um modelo comum, mas traz dados atuais
// (taxas, exemplos reais de produtos) em vez de "achismo" do modelo. É um
// recurso em preview da Groq e falha de forma intermitente (429 de rate
// limit do tier gratuito, ou 413 "Request Entity Too Large" mesmo com
// payloads pequenos — bug conhecido, não é algo que controlamos). Por isso
// há retry embutido e, se mesmo assim falhar, um fallback para um modelo
// sem busca em vez de simplesmente devolver erro pro usuário.
const SEARCH_MODEL = "groq/compound";
const FALLBACK_MODEL = "openai/gpt-oss-120b";
const REQUEST_TIMEOUT_MS = 30000;
const MAX_RETRY_WAIT_MS = 20000;

const RISK_LABELS: Record<PerfilRisco, string> = {
  conservador: "conservador (prioriza segurança e liquidez, aceita retorno menor)",
  moderado: "moderado (equilíbrio entre segurança e crescimento)",
  arrojado: "arrojado (aceita mais risco e volatilidade em troca de retorno maior)",
};

const EXPERIENCE_LABELS: Record<Experiencia, string> = {
  iniciante: "iniciante (nunca investiu ou investe há pouco tempo; precisa de explicações básicas, sem jargão)",
  intermediario: "intermediário (já investe, entende os termos básicos, quer mais profundidade)",
  avancado: "avançado (investidor experiente; pode ser direto e técnico, sem explicar o óbvio)",
};

function buildPrompt(
  valorBase: number,
  perfil: PerfilRisco,
  experiencia: Experiencia,
  comBusca: boolean
) {
  const introBusca = comBusca
    ? `Você é um educador financeiro para um app pessoal de uso individual (não é uma plataforma para o público). Use a ferramenta de busca na internet para trazer dados atuais do Brasil (taxa Selic, CDI, exemplos reais de produtos e suas taxas/condições atuais, tickers de ações/ETFs negociados na B3) antes de montar a sugestão — não invente números.`
    : `Você é um educador financeiro para um app pessoal de uso individual (não é uma plataforma para o público). A busca em tempo real não está disponível nesta geração — use seu conhecimento geral sobre o mercado brasileiro, deixando claro nos números (taxas, percentuais) que são aproximações e podem estar desatualizadas. Inclua em "alertas" um aviso específico de que esta sugestão não pôde consultar dados em tempo real.`;

  const system = `${introBusca}

Monte uma alocação DIVERSIFICADA (pelo menos 4 categorias diferentes, adequadas ao valor e ao perfil) usando produtos comuns no mercado brasileiro: Tesouro Direto (Selic, IPCA+, prefixado), CDB/LCI/LCA (prefixado ou pós-fixado), fundos DI ou multimercado, ações ou ETFs negociados na B3, fundos imobiliários (FIIs), poupança só se fizer sentido para o perfil.

Nível de experiência do investidor: ${EXPERIENCE_LABELS[experiencia]}. Adapte a linguagem de "explicacao" e "como_investir" a esse nível — para iniciante, explique o que É o produto como se fosse a primeira vez que a pessoa ouve falar (defina termos como "liquidez", "CDI", "FGC"); para avançado, seja mais técnico e direto.

Para CADA item da alocação, preencha:
- "categoria": nome específico do produto (ex: "Tesouro Selic 2029", não só "Tesouro Direto")
- "percentual": número (a soma de todos os itens deve ser exatamente 100)
- "risco": "baixo", "medio" ou "alto"
- "explicacao": o que é esse investimento e como ele funciona (uma "aula" curta, didática, no nível do investidor)
- "como_investir": passo a passo prático de como começar a aplicar nesse produto (ex: abrir conta em corretora/banco, onde encontrar o produto, valor mínimo típico) — NUNCA inclua links ou instruções de compra automática, apenas oriente o caminho manual que a pessoa mesma vai seguir

IMPORTANTE sobre links: você NÃO deve inventar URLs. Os links reais das fontes que você pesquisar serão anexados automaticamente pelo sistema — não inclua o campo "fontes" na sua resposta.

Nunca prometa rentabilidade garantida. Responda APENAS com um JSON válido, sem markdown, no formato exato:
{"resumo": "string (3-4 frases) explicando a estratégia geral e por que faz sentido para esse perfil/nível", "alocacao": [{"categoria": "string", "percentual": number, "risco": "baixo|medio|alto", "explicacao": "string", "como_investir": "string"}], "alertas": ["string"]}
Inclua em "alertas" pelo menos um aviso de que a sugestão é gerada por IA, não é consultoria de investimentos licenciada (CVM), e que decisões finais são do usuário.`;

  const user = `Valor disponível para investir este mês: R$ ${valorBase.toFixed(2)}.
Perfil de risco: ${RISK_LABELS[perfil]}.
${comBusca ? "Pesquise informações atuais e monte" : "Monte"} a alocação diversificada e explicada conforme as instruções.`;

  return { system, user };
}

function parseSuggestion(raw: string): Omit<InvestmentSuggestionPayload, "fontes"> {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);

  if (
    typeof parsed.resumo !== "string" ||
    !Array.isArray(parsed.alocacao) ||
    !Array.isArray(parsed.alertas)
  ) {
    throw new Error("Formato de resposta inesperado.");
  }
  for (const item of parsed.alocacao) {
    if (
      typeof item.categoria !== "string" ||
      typeof item.percentual !== "number" ||
      typeof item.explicacao !== "string" ||
      typeof item.como_investir !== "string"
    ) {
      throw new Error("Formato de alocação inesperado.");
    }
    if (item.risco !== "baixo" && item.risco !== "medio" && item.risco !== "alto") {
      item.risco = "medio";
    }
  }
  return parsed as Omit<InvestmentSuggestionPayload, "fontes">;
}

interface GroqSearchResult {
  title?: string;
  url?: string;
}

interface GroqMessage {
  content?: string;
  executed_tools?: { search_results?: { results?: GroqSearchResult[] } }[];
}

function extractFontes(message: GroqMessage): FonteConsultada[] {
  const fontes: FonteConsultada[] = [];
  const seen = new Set<string>();

  for (const tool of message.executed_tools ?? []) {
    for (const result of tool.search_results?.results ?? []) {
      if (!result.url || seen.has(result.url)) continue;
      seen.add(result.url);
      fontes.push({ titulo: result.title || result.url, url: result.url });
    }
  }

  return fontes.slice(0, 10);
}

const MIN_RETRY_WAIT_MS = 3000;

function parseRetryAfterMs(message: string): number {
  const match = message.match(/try again in ([\d.]+)s/i);
  const reported = match ? Math.ceil(parseFloat(match[1]) * 1000) + 500 : 5000;
  // Groq às vezes reporta uma espera curta (ex: 800ms) que não é suficiente
  // na prática para o bucket de tokens recarregar — força um piso mínimo.
  return Math.min(Math.max(reported, MIN_RETRY_WAIT_MS), MAX_RETRY_WAIT_MS);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGroq(
  apiKey: string,
  model: string,
  system: string,
  userPrompt: string
): Promise<{ message?: GroqMessage; error?: string }> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.4,
        }),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeout);
      console.error("Groq fetch failed", model, err);
      return { error: "Falha ao conectar com a Groq. Tente novamente." };
    }
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      return { message: data.choices?.[0]?.message };
    }

    const bodyText = await response.text().catch(() => "");
    let detail = bodyText;
    try {
      detail = JSON.parse(bodyText)?.error?.message ?? bodyText;
    } catch {
      // corpo não é JSON, usa o texto cru mesmo
    }
    console.error("Groq API error", model, response.status, bodyText);

    // 429 (rate limit) e 413 (bug conhecido do groq/compound, mesmo com
    // payloads pequenos) costumam ser transitórios — vale uma retentativa.
    if ((response.status === 429 || response.status === 413) && attempt === 0) {
      await sleep(response.status === 429 ? parseRetryAfterMs(detail) : MIN_RETRY_WAIT_MS);
      continue;
    }

    return {
      error: `Groq respondeu com erro (${response.status})${detail ? `: ${detail}` : ""}.`,
    };
  }

  return { error: "A Groq está com alta demanda no momento." };
}

async function callGroqWithFallback(
  apiKey: string,
  valorBase: number,
  perfil: PerfilRisco,
  experiencia: Experiencia
): Promise<{ message?: GroqMessage; modelo: string; comBusca: boolean; error?: string }> {
  const searchPrompt = buildPrompt(valorBase, perfil, experiencia, true);
  const searchResult = await callGroq(apiKey, SEARCH_MODEL, searchPrompt.system, searchPrompt.user);
  if (searchResult.message) {
    return { message: searchResult.message, modelo: SEARCH_MODEL, comBusca: true };
  }

  console.error("Busca na internet falhou, caindo para modelo sem busca", searchResult.error);
  const fallbackPrompt = buildPrompt(valorBase, perfil, experiencia, false);
  const fallbackResult = await callGroq(
    apiKey,
    FALLBACK_MODEL,
    fallbackPrompt.system,
    fallbackPrompt.user
  );
  if (fallbackResult.message) {
    return { message: fallbackResult.message, modelo: FALLBACK_MODEL, comBusca: false };
  }

  return {
    modelo: FALLBACK_MODEL,
    comBusca: false,
    error: fallbackResult.error ?? searchResult.error ?? "Falha ao gerar sugestão. Tente novamente.",
  };
}

export async function generateInvestmentSuggestion(
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    return { error: "GROQ_API_KEY não configurada no servidor." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const mes = currentMonthRef();
  const { from, to } = monthRange(mes);

  const [{ data: profile }, { data: transactionsRaw }] = await Promise.all([
    supabase.from("profiles").select("perfil_risco, experiencia").eq("user_id", user.id).single(),
    supabase.from("transactions").select("*").gte("data", from).lte("data", to),
  ]);

  const perfil = (profile?.perfil_risco ?? "moderado") as PerfilRisco;
  const experiencia = (profile?.experiencia ?? "iniciante") as Experiencia;
  const transactions = (transactionsRaw ?? []) as unknown as Transaction[];
  const { entradas, saidas } = monthTotals(transactions);
  const valorBase = Math.round((entradas - saidas) * 100) / 100;

  if (valorBase <= 0) {
    return {
      error:
        "Não há superávit este mês (entradas menores ou iguais às saídas), então não há valor para sugerir investimento.",
    };
  }

  const { message, modelo, comBusca, error } = await callGroqWithFallback(
    apiKey,
    valorBase,
    perfil,
    experiencia
  );
  if (error || !message) {
    return { error: error ?? "Resposta vazia da IA. Tente novamente." };
  }
  if (!message.content) {
    return { error: "Resposta vazia da IA. Tente novamente." };
  }

  let base: Omit<InvestmentSuggestionPayload, "fontes">;
  try {
    base = parseSuggestion(message.content);
  } catch (err) {
    console.error("Groq response parse failed", err, message.content);
    return { error: "A IA respondeu em um formato inesperado. Tente novamente." };
  }

  if (!comBusca) {
    base.alertas = [
      "Não foi possível pesquisar dados em tempo real desta vez — os números acima são aproximações com base em conhecimento geral, não em cotações atuais.",
      ...base.alertas,
    ];
  }

  const sugestao: InvestmentSuggestionPayload = {
    ...base,
    fontes: extractFontes(message),
  };

  const { error: insertError } = await supabase.from("investment_suggestions").insert({
    user_id: user.id,
    mes_referencia: `${mes}-01`,
    valor_base: valorBase,
    perfil_risco: perfil,
    experiencia,
    sugestao: sugestao as unknown as Json,
    modelo,
  });

  if (insertError) return { error: insertError.message };

  revalidatePath("/investimentos");
  return {};
}

export async function updateInvestorProfile(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const updates: { perfil_risco?: PerfilRisco; experiencia?: Experiencia } = {};

  const perfil = formData.get("perfil_risco");
  if (perfil !== null) {
    if (!["conservador", "moderado", "arrojado"].includes(String(perfil))) {
      return { error: "Perfil de risco inválido." };
    }
    updates.perfil_risco = perfil as PerfilRisco;
  }

  const experiencia = formData.get("experiencia");
  if (experiencia !== null) {
    if (!["iniciante", "intermediario", "avancado"].includes(String(experiencia))) {
      return { error: "Nível de experiência inválido." };
    }
    updates.experiencia = experiencia as Experiencia;
  }

  if (Object.keys(updates).length === 0) return {};

  const { error } = await supabase.from("profiles").update(updates).eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/investimentos");
  return {};
}
