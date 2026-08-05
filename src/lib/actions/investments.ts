"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { currentMonthRef, monthRange, monthTotals } from "@/lib/finance";
import type { ActionState } from "@/lib/actions/accounts";
import type { InvestmentSuggestionPayload, Json, PerfilRisco, Transaction } from "@/types/database";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b";

const RISK_LABELS: Record<PerfilRisco, string> = {
  conservador: "conservador (prioriza segurança e liquidez, aceita retorno menor)",
  moderado: "moderado (equilíbrio entre segurança e crescimento)",
  arrojado: "arrojado (aceita mais risco e volatilidade em troca de retorno maior)",
};

function buildPrompt(valorBase: number, perfil: PerfilRisco) {
  const system = `Você é um assistente de educação financeira para um app pessoal (uso individual, não é uma plataforma para o público). Sugira uma alocação de investimentos em Reais (BRL), usando categorias comuns no mercado brasileiro (ex: Reserva de emergência em Tesouro Selic ou CDB com liquidez diária, CDB/LCI/LCA prefixado ou pós-fixado, Tesouro IPCA+, fundos multimercado, ações/ETFs, fundos imobiliários). Nunca prometa rentabilidade garantida. Sempre inclua um alerta deixando claro que a sugestão é gerada por IA, não é consultoria de investimentos licenciada (CVM) e que decisões finais são do usuário. Responda APENAS com um JSON válido, sem markdown, no formato exato:
{"resumo": "string curta (2-3 frases) explicando a estratégia geral", "alocacao": [{"categoria": "string", "percentual": number, "justificativa": "string curta"}], "alertas": ["string"]}
Os percentuais de "alocacao" devem somar exatamente 100.`;

  const user = `Valor disponível para investir este mês: R$ ${valorBase.toFixed(2)}.
Perfil de risco do investidor: ${RISK_LABELS[perfil]}.
Sugira uma alocação adequada a esse valor e perfil.`;

  return { system, user };
}

function parseSuggestion(raw: string): InvestmentSuggestionPayload {
  const parsed = JSON.parse(raw);
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
      typeof item.justificativa !== "string"
    ) {
      throw new Error("Formato de alocação inesperado.");
    }
  }
  return parsed as InvestmentSuggestionPayload;
}

export async function generateInvestmentSuggestion(
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const apiKey = process.env.GROQ_API_KEY;
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
    supabase.from("profiles").select("perfil_risco").eq("user_id", user.id).single(),
    supabase.from("transactions").select("*").gte("data", from).lte("data", to),
  ]);

  const perfil = (profile?.perfil_risco ?? "moderado") as PerfilRisco;
  const transactions = (transactionsRaw ?? []) as unknown as Transaction[];
  const { entradas, saidas } = monthTotals(transactions);
  const valorBase = Math.round((entradas - saidas) * 100) / 100;

  if (valorBase <= 0) {
    return {
      error:
        "Não há superávit este mês (entradas menores ou iguais às saídas), então não há valor para sugerir investimento.",
    };
  }

  const { system, user: userPrompt } = buildPrompt(valorBase, perfil);

  let content: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const bodyText = await response.text().catch(() => "");
      let detail = bodyText;
      try {
        detail = JSON.parse(bodyText)?.error?.message ?? bodyText;
      } catch {
        // corpo não é JSON, usa o texto cru mesmo
      }
      console.error("Groq API error", response.status, bodyText);
      return {
        error: `Groq respondeu com erro (${response.status})${detail ? `: ${detail}` : ""}. Tente novamente.`,
      };
    }

    const data = await response.json();
    content = data.choices?.[0]?.message?.content;
    if (!content) {
      return { error: "Resposta vazia da IA. Tente novamente." };
    }
  } catch (err) {
    console.error("Groq fetch failed", err);
    return { error: "Falha ao conectar com a Groq. Tente novamente." };
  }

  let sugestao: InvestmentSuggestionPayload;
  try {
    sugestao = parseSuggestion(content);
  } catch (err) {
    console.error("Groq response parse failed", err, content);
    return { error: "A IA respondeu em um formato inesperado. Tente novamente." };
  }

  const { error: insertError } = await supabase.from("investment_suggestions").insert({
    user_id: user.id,
    mes_referencia: `${mes}-01`,
    valor_base: valorBase,
    perfil_risco: perfil,
    sugestao: sugestao as unknown as Json,
    modelo: GROQ_MODEL,
  });

  if (insertError) return { error: insertError.message };

  revalidatePath("/investimentos");
  return {};
}

export async function updateRiskProfile(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const perfil = String(formData.get("perfil_risco") ?? "") as PerfilRisco;
  if (!["conservador", "moderado", "arrojado"].includes(perfil)) {
    return { error: "Perfil inválido." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ perfil_risco: perfil })
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/investimentos");
  return {};
}
