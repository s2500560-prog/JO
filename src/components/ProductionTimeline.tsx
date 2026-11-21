import React from 'react';
import { PRODUCTION_STAGES } from '../logic/workshopRules';
import type { ProductionStage } from '../types/saw2sale';

interface ProductionTimelineProps {
  currentStage: ProductionStage | null;
}

export const ProductionTimeline: React.FC<ProductionTimelineProps> = ({
  currentStage,
}) => {
  const currentIdx = currentStage
    ? PRODUCTION_STAGES.indexOf(currentStage)
    : -1;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {PRODUCTION_STAGES.map((stageName, idx) => {
        const isCompleted = currentIdx > idx;
        const isCurrent = currentIdx === idx;
        return (
          <div
            key={stageName}
            className={`p-3.5 rounded-2xl border ${
              isCurrent
                ? 'bg-[#1B1712] text-white border-[#1B1712]'
                : isCompleted
                  ? 'bg-[#1F6B43]/15 text-[#1F6B43] border-[#1F6B43]/30'
                  : 'bg-white/60 text-[#5C5446] border-[#D9D2C3]'
            }`}
          >
            <div className="text-xs opacity-75">Stage {idx + 1}</div>
            <div className="text-sm font-semibold mt-0.5">{stageName}</div>
          </div>
        );
      })}
    </div>
  );
};
