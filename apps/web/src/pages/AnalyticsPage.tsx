/* AnalyticsPage page */
import { useMemo } from 'react';
import { TrendingUp, DollarSign, BarChart2, Activity } from 'lucide-react';
import { KPICard } from '../components/ui/KPICard';
import { useOrders } from '../hooks/useOrders';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export function AnalyticsPage() {
  const { orders, loading } = useOrders();

  const stats = useMemo(() => {
    const orderList = orders || [];
    const revenue = orderList.reduce((acc: number, o: any) => acc + Number(o.amount || o.total_amount || 0), 0);
    const avg = orderList.length > 0 ? revenue / orderList.length : 0;
    const pending = orderList.filter((o: any) => o.status === 'HELD' || o.payment_released === false).length;
    return {
      revenue,
      avg,
      pending,
      total: orderList.length,
      chartData: orderList.slice(0, 7).map((o: any, idx: number) => ({
        name: `Ord ${idx + 1}`,
        amount: Number(o.amount || o.total_amount || 0),
      })).reverse(),
      statusData: [
        { name: 'Completados', value: orderList.filter((o: any) => o.status === 'COMPLETED').length },
        { name: 'En espera', value: orderList.filter((o: any) => o.status === 'HELD').length },
        { name: 'Rechazados', value: orderList.filter((o: any) => o.status === 'REJECTED').length },
      ].filter(d => d.value > 0)
    };
  }, [orders]);

  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <KPICard title="Revenue Total" subtitle="Volumen procesado" value={fmt(stats.revenue)} icon={TrendingUp} color="bg-blue-900/50 text-blue-400" />
      <KPICard title="Valor Promedio de Orden" subtitle="AOV" value={fmt(stats.avg)} icon={DollarSign} color="bg-indigo-900/50 text-indigo-400" />
      <KPICard title="Payouts Pendientes" subtitle="En revisión de calidad" value={String(stats.pending)} icon={Activity} color="bg-amber-900/50 text-amber-400" />

      <div className="md:col-span-2 bg-slate-900/50 rounded-3xl border border-slate-800 p-6 shadow-xl backdrop-blur">
        <h3 className="text-sm font-semibold mb-4 text-slate-300 flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-blue-400" />
          Tendencia de Revenue (Últimas Órdenes)
        </h3>
        <div className="h-64">
          {loading ? (
            <div className="h-full w-full animate-pulse bg-slate-800/40 rounded-xl" />
          ) : stats.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#e2e8f0' }} />
                <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-slate-500 text-sm">Sin datos disponibles</div>
          )}
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6 shadow-xl backdrop-blur">
        <h3 className="text-sm font-semibold mb-4 text-slate-300 flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-emerald-400" />
          Estado de Órdenes
        </h3>
        <div className="h-64">
          {loading ? (
            <div className="h-full w-full animate-pulse bg-slate-800/40 rounded-xl" />
          ) : stats.statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#e2e8f0' }} />
                <Bar dataKey="value" fill="#22c55e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-slate-500 text-sm">Sin datos disponibles</div>
          )}
        </div>
      </div>
    </div>
  );
}