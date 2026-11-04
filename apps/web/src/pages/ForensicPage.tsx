/* ForensicPage page */
import { Box } from 'lucide-react';

export function ForensicPage() {
  return (
    <div className="rounded-3xl border border-slate-800 bg-[#0a0a0f]/60 backdrop-blur shadow-xl p-8 flex flex-col items-center justify-center text-center">
      <Box className="h-20 w-20 text-blue-400 animate-pulse mb-4" />
      <h2 className="text-lg font-semibold text-slate-100">Forensic Ledger</h2>
      <p className="mt-2 text-sm text-slate-500 max-w-md">
        Trazabilidad forense de sesiones de inspección y transacciones PayPal.
      </p>
    </div>
  );
}