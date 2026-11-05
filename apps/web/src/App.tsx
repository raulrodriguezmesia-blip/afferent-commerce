import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { TABS } from './components/ui/Tabs';
import { SettlementWizard } from './pages/SettlementWizard';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ForensicPage } from './pages/ForensicPage';
import { useOrders } from './hooks/useOrders';
import { P0Cards } from './components/P0Cards';
import { AgentObservabilityCenter } from './components/AgentObservabilityCenter';
import { SystemHealthBoard } from './components/SystemHealthBoard';
import { SettlementTimeline } from './components/SettlementTimeline';
import FloatingChat from './components/chat/FloatingChat';
import './styles/index.css';

export default function App() {
  const [activeTab, setActiveTab] = useState<'wizard' | 'analytics' | 'forensic'>('wizard');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { refetch } = useOrders();

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Toaster position="top-right" />

      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <img src="/logo.svg" alt="Afferent Commerce" className="h-10 w-auto" />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">Afferent Commerce</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">
              Agentic Settlement Intelligence
            </p>
          </div>
        </div>
        <nav className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/10 backdrop-blur-md">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all duration-200 ${
                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              <tab.Icon size={14} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-[1600px] mx-auto px-6 py-6 w-full overflow-auto">
        {activeTab === 'wizard' && (
          <div className="grid grid-cols-12 gap-6 w-full h-full">
            <aside className="col-span-12 lg:col-span-3 min-w-0 space-y-6">
              <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-xl relative overflow-hidden space-y-6">
                <P0Cards />
                <div className="h-px bg-white/5 w-full" />
                <AgentObservabilityCenter />
                <div className="h-px bg-white/5 w-full" />
                <SystemHealthBoard />
              </div>
            </aside>

            <section className="col-span-12 lg:col-span-6 min-w-0 bg-slate-900/60 border border-white/15 rounded-2xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden space-y-6">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50" />
              <SettlementWizard activeTab={activeTab} setActiveTab={setActiveTab} />
            </section>

            <aside className="col-span-12 lg:col-span-3 min-w-0 space-y-6">
              <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-xl relative overflow-hidden h-full">
                <SettlementTimeline />
              </div>
            </aside>
          </div>
        )}

        {activeTab === 'analytics' && <AnalyticsPage />}
        {activeTab === 'forensic' && <ForensicPage />}
      </main>

      <FloatingChat isOpen={isChatOpen} onToggle={() => setIsChatOpen((prev) => !prev)} />
    </div>
  );
}
