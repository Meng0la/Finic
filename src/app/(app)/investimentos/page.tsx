import { getInvestmentSuggestions, getProfile, getTransactions } from "@/lib/data";
import { currentMonthRef, formatBRL, monthRange, monthTotals } from "@/lib/finance";
import { PageHeader } from "@/components/layout/PageHeader";
import { InvestorProfileForm } from "@/components/investments/InvestorProfileForm";
import { GenerateSuggestionButton } from "@/components/investments/GenerateSuggestionButton";
import { SuggestionCard } from "@/components/investments/SuggestionCard";
import { LuxuryAurora } from "@/components/brand/LuxuryAurora";

export default async function InvestimentosPage() {
  const mes = currentMonthRef();
  const { from, to } = monthRange(mes);

  const [profile, transactions, suggestions] = await Promise.all([
    getProfile(),
    getTransactions({ from, to }),
    getInvestmentSuggestions(),
  ]);

  const { entradas, saidas } = monthTotals(transactions);
  const superavit = Math.round((entradas - saidas) * 100) / 100;
  const [latest, ...historico] = suggestions;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Planejamento" title="Investimentos" />

      <div className="surface-card relative overflow-hidden bg-navy p-6">
        <LuxuryAurora particleCount={10} vignette={false} />
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold-soft">
              Superávit do mês
            </p>
            <p className="font-display mt-2 text-4xl font-semibold text-gold-strong">
              {formatBRL(superavit)}
            </p>
            <p className="mt-1 text-xs text-[#93a0b8]">
              Entradas ({formatBRL(entradas)}) menos saídas ({formatBRL(saidas)}) do mês corrente.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <InvestorProfileForm
              perfilAtual={profile?.perfil_risco ?? "moderado"}
              experienciaAtual={profile?.experiencia ?? "iniciante"}
            />
            <GenerateSuggestionButton disabled={superavit <= 0} />
          </div>
        </div>
      </div>

      {superavit <= 0 && (
        <p className="text-sm text-ink-muted">
          Sem superávit este mês, não há o que sugerir ainda. Volte quando entradas superarem as
          saídas.
        </p>
      )}

      {latest ? (
        <SuggestionCard suggestion={latest} highlight />
      ) : (
        superavit > 0 && (
          <p className="text-sm text-ink-muted">
            Nenhuma sugestão gerada ainda este mês. Clique em &quot;Gerar sugestão&quot; acima —
            a IA pesquisa dados atuais na internet antes de montar a alocação, então pode levar
            meio minuto.
          </p>
        )
      )}

      {historico.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="field-label">Histórico</h2>
          {historico.map((s) => (
            <SuggestionCard key={s.id} suggestion={s} />
          ))}
        </div>
      )}

      <p className="text-xs text-ink-muted">
        As sugestões acima são geradas por inteligência artificial com base nos seus lançamentos e
        em pesquisas feitas na internet no momento da geração — não constituem consultoria de
        investimentos licenciada (CVM). Os links de &quot;fontes consultadas&quot; são páginas que a IA
        pesquisou para embasar a resposta, não links de compra: a aplicação em si é sempre feita
        por você, diretamente na sua corretora ou banco. Use como ponto de partida informativo —
        decisões finais são sempre suas.
      </p>
    </div>
  );
}
