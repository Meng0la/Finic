"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { currentMonthRef, monthRange, monthTotals } from "@/lib/finance";
import { callGroqChat } from "@/lib/groq";
import type { ActionState } from "@/lib/actions/accounts";
import type {
  Experiencia,
  FonteConsultada,
  InvestmentSuggestionPayload,
  Json,
  PerfilRisco,
  Transaction,
} from "@/types/database";

// groq/compound (busca embutida) falha de forma intermitente e frequente no
// tier gratuito (429 de rate limit, 413 "Request Entity Too Large" mesmo com
// payloads pequenos — bug conhecido, não é algo que controlamos). Em vez de
// depender dele, buscamos os números reais (Selic, CDI, IPCA) direto na API
// pública do Banco Central (gratuita, sem chave, sem limite de taxa) e
// passamos como fato pronto pro modelo — mais rápido e muito mais confiável
// do que pedir pro modelo "pesquisar" sozinho.
const GROQ_MODEL = "openai/gpt-oss-120b";

const BCB_SERIES = {
  selic: "432", // Meta Selic definida pelo Copom (% a.a.)
  cdi: "4389", // CDI acumulado no mês anualizado, base 252 (% a.a.)
  ipca12m: "13522", // IPCA acumulado em 12 meses (%)
} as const;

interface IndicadoresMercado {
  selic: string | null;
  selicData: string | null;
  cdi: string | null;
  ipca12m: string | null;
}

async function fetchBcbSerie(codigo: string): Promise<{ valor: string; data: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(
      `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados/ultimos/1?formato=json`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!response.ok) return null;
    const data = await response.json();
    const ultimo = data?.[0];
    if (!ultimo?.valor) return null;
    return { valor: ultimo.valor, data: ultimo.data };
  } catch (err) {
    console.error("Falha ao buscar série BCB", codigo, err);
    return null;
  }
}

async function fetchIndicadoresMercado(): Promise<IndicadoresMercado> {
  const [selic, cdi, ipca] = await Promise.all([
    fetchBcbSerie(BCB_SERIES.selic),
    fetchBcbSerie(BCB_SERIES.cdi),
    fetchBcbSerie(BCB_SERIES.ipca12m),
  ]);

  return {
    selic: selic?.valor ?? null,
    selicData: selic?.data ?? null,
    cdi: cdi?.valor ?? null,
    ipca12m: ipca?.valor ?? null,
  };
}

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
  indicadores: IndicadoresMercado
) {
  const temIndicadores = indicadores.selic || indicadores.cdi || indicadores.ipca12m;

  const linhasIndicadores = temIndicadores
    ? `Dados reais e atuais do mercado brasileiro (fonte: Banco Central do Brasil, SGS, ${indicadores.selicData ?? "hoje"}):
- Taxa Selic (meta Copom): ${indicadores.selic ?? "indisponível"}% a.a.
- CDI (anualizado): ${indicadores.cdi ?? "indisponível"}% a.a.
- IPCA acumulado 12 meses: ${indicadores.ipca12m ?? "indisponível"}%
Use ESSES números reais ao explicar rentabilidade de produtos atrelados a Selic/CDI/IPCA — não invente outros valores para essas taxas.`
    : `Não foi possível obter as taxas atuais do Banco Central nesta geração — deixe claro nos números que são aproximações e podem estar desatualizadas.`;

  const system = `Você é um educador financeiro para um app pessoal de uso individual (não é uma plataforma para o público).

${linhasIndicadores}

Nomes específicos de produtos (ex: qual CDB de qual banco, qual FII) são exemplos ilustrativos do tipo de produto, não ofertas em tempo real — deixe isso implícito ao usar "produtos como X" em vez de afirmar que é a oferta exata do dia.

Monte uma alocação DIVERSIFICADA (pelo menos 4 categorias diferentes, adequadas ao valor e ao perfil) usando produtos comuns no mercado brasileiro: Tesouro Direto (Selic, IPCA+, prefixado), CDB/LCI/LCA (prefixado ou pós-fixado), fundos DI ou multimercado, ações ou ETFs negociados na B3, fundos imobiliários (FIIs), poupança só se fizer sentido para o perfil.

Nível de experiência do investidor: ${EXPERIENCE_LABELS[experiencia]}. Adapte a linguagem de "explicacao" e "como_investir" a esse nível — para iniciante, explique o que É o produto como se fosse a primeira vez que a pessoa ouve falar (defina termos como "liquidez", "CDI", "FGC"); para avançado, seja mais técnico e direto.

Para CADA item da alocação, preencha:
- "categoria": nome específico do produto (ex: "Tesouro Selic 2029", não só "Tesouro Direto")
- "percentual": número (a soma de todos os itens deve ser exatamente 100)
- "risco": "baixo", "medio" ou "alto"
- "explicacao": o que é esse investimento e como ele funciona (uma "aula" curta, didática, no nível do investidor)
- "como_investir": passo a passo prático de como começar a aplicar nesse produto (ex: abrir conta em corretora/banco, onde encontrar o produto, valor mínimo típico) — NUNCA inclua links ou instruções de compra automática, apenas oriente o caminho manual que a pessoa mesma vai seguir

Não inclua o campo "fontes" na sua resposta — o sistema anexa isso automaticamente.

Nunca prometa rentabilidade garantida. Responda APENAS com um JSON válido, sem markdown, no formato exato:
{"resumo": "string (3-4 frases) explicando a estratégia geral e por que faz sentido para esse perfil/nível", "alocacao": [{"categoria": "string", "percentual": number, "risco": "baixo|medio|alto", "explicacao": "string", "como_investir": "string"}], "alertas": ["string"]}
Inclua em "alertas" pelo menos um aviso de que a sugestão é gerada por IA, não é consultoria de investimentos licenciada (CVM), e que decisões finais são do usuário.`;

  const user = `Valor disponível para investir este mês: R$ ${valorBase.toFixed(2)}.
Perfil de risco: ${RISK_LABELS[perfil]}.
Monte a alocação diversificada e explicada conforme as instruções.`;

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

function callGroq(
  apiKey: string,
  system: string,
  userPrompt: string
): Promise<{ content?: string; error?: string }> {
  return callGroqChat(apiKey, {
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.4,
  });
}

function fontesBcb(indicadores: IndicadoresMercado): FonteConsultada[] {
  if (!indicadores.selic && !indicadores.cdi && !indicadores.ipca12m) return [];
  return [
    {
      titulo: "Taxa Selic — Banco Central do Brasil",
      url: "https://www.bcb.gov.br/controleinflacao/taxaselic",
    },
    {
      titulo: "Séries temporais (SGS) — Banco Central do Brasil",
      url: "https://www3.bcb.gov.br/sgspub/localizarseries/localizarSeries.do?method=prepararTelaLocalizarSeries",
    },
  ];
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

  const [{ data: profile }, { data: transactionsRaw }, indicadores] = await Promise.all([
    supabase.from("profiles").select("perfil_risco, experiencia").eq("user_id", user.id).single(),
    supabase.from("transactions").select("*").gte("data", from).lte("data", to),
    fetchIndicadoresMercado(),
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

  const { system, user: userPrompt } = buildPrompt(valorBase, perfil, experiencia, indicadores);
  const { content, error } = await callGroq(apiKey, system, userPrompt);
  if (error || !content) {
    return { error: error ?? "Resposta vazia da IA. Tente novamente." };
  }

  let base: Omit<InvestmentSuggestionPayload, "fontes">;
  try {
    base = parseSuggestion(content);
  } catch (err) {
    console.error("Groq response parse failed", err, content);
    return { error: "A IA respondeu em um formato inesperado. Tente novamente." };
  }

  if (!indicadores.selic && !indicadores.cdi && !indicadores.ipca12m) {
    base.alertas = [
      "Não foi possível consultar as taxas atuais do Banco Central desta vez — os números acima são aproximações.",
      ...base.alertas,
    ];
  }

  const sugestao: InvestmentSuggestionPayload = {
    ...base,
    fontes: fontesBcb(indicadores),
  };

  const { error: insertError } = await supabase.from("investment_suggestions").insert({
    user_id: user.id,
    mes_referencia: `${mes}-01`,
    valor_base: valorBase,
    perfil_risco: perfil,
    experiencia,
    sugestao: sugestao as unknown as Json,
    modelo: GROQ_MODEL,
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
