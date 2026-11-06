from pathlib import Path
p = Path("src/pages/SettlementWizard.tsx")
lines = p.read_text(encoding="utf-8").splitlines()
new = [
    "      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>",
    "        <KPICard title='Estado de Solvencia' value='94.2%' subtitle='up' icon={ShieldCheck} color='bg-green-900/50 text-green-400' />",
    "        <KPICard title='Riesgo Operativo' value='Bajo' subtitle='stable' icon={AlertTriangle} color='bg-yellow-900/50 text-yellow-400' />",
    "        <KPICard title='Tiempo de Liquidación' value='~2.4s' subtitle='down' icon={FileText} color='bg-blue-900/50 text-blue-400' />",
    "      </div>",
    "",
    "      <AIDecisionEvidence />",
]
# Replace the known broken block at 1-based lines 243-247.
start = 242
end = 247
lines[start:end] = new
p.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("updated")
