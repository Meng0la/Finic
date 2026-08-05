import { getGoals } from "@/lib/data";
import { PageHeader } from "@/components/layout/PageHeader";
import { GoalForm } from "@/components/goals/GoalForm";
import { GoalCard } from "@/components/goals/GoalCard";

export default async function MetasPage() {
  const goals = await getGoals();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Planejamento" title="Metas de economia" />
      {goals.length === 0 ? (
        <p className="text-sm text-ink-muted">Nenhuma meta criada ainda.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
      <GoalForm />
    </div>
  );
}
