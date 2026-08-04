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

export function CategoryPieChart({
  data,
}: {
  data: { categoria: string; cor: string; total: number }[];
}) {
  if (data.length === 0) {
    return <p className="text-sm text-zinc-500">Sem despesas neste mês.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="categoria" innerRadius={60} outerRadius={90} paddingAngle={2}>
          {data.map((entry) => (
            <Cell key={entry.categoria} fill={entry.cor} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatBRL(Number(value))} />
        <Legend />
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
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
        <XAxis dataKey="mes" fontSize={12} />
        <YAxis fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
        <Tooltip formatter={(value) => formatBRL(Number(value))} />
        <Legend />
        <Bar dataKey="entradas" name="Entradas" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="saidas" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
