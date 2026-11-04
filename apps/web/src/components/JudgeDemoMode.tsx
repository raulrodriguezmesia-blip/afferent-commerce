import React from 'react';

interface JudgeDemoModeProps {
  onLoadScenario: () => void;
}

export const JudgeDemoMode: React.FC<JudgeDemoModeProps> = ({ onLoadScenario }) => {
  return (
    <div className="panel">
      <h4 className="panel-title">Judge Demo Mode</h4>
      <button
        type="button"
        onClick={onLoadScenario}
        className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:from-violet-500 hover:to-fuchsia-500"
      >
        Load Executive Scenario
      </button>
    </div>
  );
};