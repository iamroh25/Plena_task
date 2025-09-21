import { useEffect, useMemo, useState } from "react";
import { ResponsivePie } from "@nivo/pie";
import { useSelector } from "react-redux";

type Row = {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  holdings: number;
  value?: number;
};

const LS_KEY = "watchlistData";

const formatCurrency = (n: number) =>
  n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

const colorPalette = [
  "#4ade80",
  "#60a5fa",
  "#f59e0b",
  "#a78bfa",
  "#f87171",
  "#34d399",
  "#fb923c",
  "#22d3ee",
  "#f472b6",
  "#93c5fd",
];

const Dashboard = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const lastUpdatedISO = useSelector((store: any) => store?.lastUpdated) as
    | string
    | undefined;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed: Row[] = JSON.parse(raw);
      if (Array.isArray(parsed)) setRows(parsed);
    } catch {}
  }, []);

  const { total, pieData, legendData } = useMemo(() => {
    const withValue = rows.map((r) => ({
      ...r,
      value:
        r.value != null ? r.value : (r.holdings || 0) * (r.current_price || 0),
    }));
    const totalValue = withValue.reduce((sum, r) => sum + (r.value || 0), 0);
    const sorted = [...withValue].sort(
      (a, b) => (b.value || 0) - (a.value || 0)
    );
    const top = sorted.slice(0, 5);
    const rest = sorted.slice(5);
    const restSum = rest.reduce((s, r) => s + (r.value || 0), 0);

    const baseData = top.map((r, i) => ({
      id: r.id,
      label: `${r.name} (${r.symbol?.toUpperCase()})`,
      value: r.value || 0,
      color: colorPalette[i % colorPalette.length],
    }));
    if (restSum > 0)
      baseData.push({
        id: "others",
        label: "Others",
        value: restSum,
        color: "#6b7280",
      });

    const legend = baseData
      .filter((d) => d.value > 0)
      .map((d) => ({
        id: d.id,
        label: d.label,
        color: d.color,
        pct: totalValue > 0 ? (d.value / totalValue) * 100 : 0,
      }));

    return { total: totalValue, pieData: baseData, legendData: legend };
  }, [rows]);

  const lastUpdatedTime = lastUpdatedISO
    ? new Date(lastUpdatedISO).toLocaleTimeString()
    : "—";

  return (
    <div className="relative border border-[#2a2a2a] rounded-lg p-5 pb-10 h-[288px] overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
        <div className="lg:col-span-5 min-h-0">
          <div className="text-sm text-gray-400 mb-2">Portfolio Total</div>
          <div className="text-4xl sm:text-5xl font-bold">
            {formatCurrency(total)}
          </div>
        </div>

        <div className="lg:col-span-7 min-h-0">
          <div className="text-sm text-center text-gray-400 mb-2">
            Portfolio Total
          </div>
          <div className="flex items-center gap-6 min-h-0">
            <div className="h-[208px] w-[208px] sm:h-[220px] sm:w-[220px]">
              <ResponsivePie
                data={pieData}
                margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                innerRadius={0.6}
                padAngle={1.5}
                cornerRadius={3}
                colors={{ datum: "data.color" }}
                enableArcLabels={false}
                enableArcLinkLabels={false}
                activeOuterRadiusOffset={6}
                theme={{
                  background: "transparent",
                  text: { fill: "#e5e7eb" },
                  tooltip: {
                    container: { background: "#111827", color: "#e5e7eb" },
                  },
                  legends: { text: { fill: "#e5e7eb" } },
                }}
              />
            </div>

            <div className="flex-1 min-w-[220px] min-h-0 overflow-y-auto">
              <ul className="space-y-1">
                {legendData.length === 0 && (
                  <li className="text-gray-500 text-sm">No data</li>
                )}
                {legendData.map((d) => (
                  <li key={d.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded-sm"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="truncate">{d.label}</span>
                    </span>
                    <span className="text-gray-400">{d.pct.toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-2 left-3 text-xs text-gray-500">
        Last updated: {lastUpdatedTime}
      </div>
    </div>
  );

};

export default Dashboard;
