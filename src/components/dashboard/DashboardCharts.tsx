"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatBRL } from "@/lib/finance";

const TOOLTIP_STYLE = {
  background: "#ffffff",
  border: "1px solid #e4ddcc",
  borderRadius: 8,
  fontSize: 13,
};

interface LegendPayloadEntry {
  value?: string;
  color?: string;
}

// O <Legend> padrão do Recharts colore o texto de cada item igual à cor da
// série/fatia (inclusive amarelo claro em fundo branco, ilegível). Aqui só a
// bolinha usa a cor; o texto fica sempre numa cor neutra e legível.
function LegibleLegend({ payload }: { payload?: LegendPayloadEntry[] }) {
  if (!payload?.length) return null;
  return (
    <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
      {payload.map((entry, i) => (
        <li key={i} className="flex items-center gap-1.5 text-xs text-ink-muted">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.value}
        </li>
      ))}
    </ul>
  );
}

export function CategoryPieChart({
  data,
}: {
  data: { categoria: string; cor: string; total: number }[];
}) {
  if (data.length === 0) {
    return <p className="text-sm text-ink-muted">Sem despesas neste mês.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="categoria" innerRadius={60} outerRadius={90} paddingAngle={2}>
          {data.map((entry) => (
            <Cell key={entry.categoria} fill={entry.cor} stroke="#ffffff" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatBRL(Number(value))} contentStyle={TOOLTIP_STYLE} />
        <Legend content={<LegibleLegend />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function MonthlyComparisonChart({
  data,
}: {
  data: { mes: string; entradas: number; saidas: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4ddcc" />
        <XAxis dataKey="mes" fontSize={12} stroke="#636b80" tickLine={false} axisLine={{ stroke: "#e4ddcc" }} />
        <YAxis
          fontSize={12}
          stroke="#636b80"
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v / 1000}k`}
        />
        <Tooltip formatter={(value) => formatBRL(Number(value))} contentStyle={TOOLTIP_STYLE} />
        <Legend content={<LegibleLegend />} />
        <Bar dataKey="entradas" name="Entradas" fill="#1f6d4a" radius={[4, 4, 0, 0]} />
        <Bar dataKey="saidas" name="Saídas" fill="#8c2f39" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
