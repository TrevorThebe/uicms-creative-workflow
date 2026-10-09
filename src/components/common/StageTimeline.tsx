import React from 'react';
import { WorkflowStage } from '../../types';
import { STAGE_CONFIG, STAGE_ORDER } from './StatusBadge';
import { Check, Clock, Lock, Sparkles } from 'lucide-react';

interface StageTimelineProps {
  currentStage: WorkflowStage;
  onSelectStage?: (stage: WorkflowStage) => void;
  interactive?: boolean;
}

export const StageTimeline: React.FC<StageTimelineProps> = ({
  currentStage,
  onSelectStage,
  interactive = false,
}) => {
  const currentStep = STAGE_CONFIG[currentStage]?.step || 1;

  return (
    <div className="w-full overflow-x-auto py-3 px-1 no-scrollbar">
      <div className="flex items-center min-w-[850px] relative">
        {/* Background Track */}
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1 bg-slate-800 -z-0 rounded-full" />

        {/* Progress fill */}
        <div
          className="absolute top-1/2 left-4 -translate-y-1/2 h-1 bg-indigo-600 -z-0 rounded-full transition-all duration-500"
          style={{
            width: `${Math.max(0, ((currentStep - 1) / (STAGE_ORDER.length - 1)) * 100)}%`,
          }}
        />

        {/* Stage Nodes */}
        <div className="flex justify-between w-full relative z-10">
          {STAGE_ORDER.map((stage, idx) => {
            const conf = STAGE_CONFIG[stage];
            const isCompleted = conf.step < currentStep;
            const isCurrent = conf.step === currentStep;
            const isUpcoming = conf.step > currentStep;

            return (
              <button
                key={stage}
                type="button"
                disabled={!interactive}
                onClick={() => interactive && onSelectStage?.(stage)}
                className={`flex flex-col items-center group relative focus:outline-none ${
                  interactive ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                {/* Node circle */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 border-2 ${
                    isCurrent
                      ? 'bg-indigo-600 text-white border-indigo-400 ring-4 ring-indigo-500/20 scale-110 shadow-lg shadow-indigo-500/30'
                      : isCompleted
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-slate-900 text-slate-400 border-slate-700 group-hover:border-slate-500'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : isCurrent ? (
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  ) : (
                    <span>{conf.step}</span>
                  )}
                </div>

                {/* Stage Title */}
                <span
                  className={`mt-1.5 text-[11px] font-medium tracking-tight whitespace-nowrap transition-colors ${
                    isCurrent
                      ? 'text-indigo-300 font-semibold'
                      : isCompleted
                      ? 'text-slate-300'
                      : 'text-slate-400'
                  }`}
                >
                  {conf.shortLabel}
                </span>

                {/* Hover Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute bottom-full mb-2 bg-slate-900 text-slate-200 border border-slate-700 rounded-md px-2 py-1 text-[11px] whitespace-nowrap shadow-xl transition-opacity z-30">
                  <p className="font-semibold text-white">{conf.label}</p>
                  <p className="text-slate-400 text-[10px]">{conf.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
