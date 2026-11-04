/* KPICard component */
import { motion } from 'framer-motion';

interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.FC<{ size?: number }>;
  color: string;
}

export function KPICard({ title, value, subtitle, icon: Icon, color }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 shadow-xl shadow-black/20 backdrop-blur-xl"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className={`rounded-xl p-2.5 ${color}`}>
          <Icon size={18} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{subtitle}</span>
      </div>
      <p className="text-xs font-medium text-slate-400">{title}</p>
      <h3 className="mt-1 font-mono text-2xl font-bold tracking-tight text-slate-100">{value}</h3>
    </motion.div>
  );
}