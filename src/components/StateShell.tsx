import React from 'react';
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import type { ScreenStateMode } from '../types/saw2sale';

interface StateShellProps {
  mode: ScreenStateMode;
  onRetry: () => void;
  emptyTitle: string;
  emptyDescription: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  errorMessage?: string;
  children: React.ReactNode;
}

export const StateShell: React.FC<StateShellProps> = ({
  mode,
  onRetry,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  errorMessage = 'Could not load workshop records from local storage. Check connection and try again.',
  children,
}) => {
  if (mode === 'loading') {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading view">
        {/* Hero KPI Skeleton */}
        <div className="glass-dark continuous-card p-6 flex items-center justify-between gap-6">
          <div className="space-y-2.5 flex-1">
            <div className="h-3.5 w-32 rounded bg-white/20 animate-pulse" />
            <div className="h-9 w-64 rounded-lg bg-white/25 animate-pulse" />
            <div className="h-3.5 w-80 rounded bg-white/15 animate-pulse" />
          </div>
          <div className="h-12 w-36 continuous-control bg-white/20 animate-pulse shrink-0" />
        </div>

        {/* Split Metric Skeletons */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-7 glass-clear continuous-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-44 rounded bg-[#1B1712]/15 animate-pulse" />
              <div className="h-4 w-20 rounded bg-[#1B1712]/10 animate-pulse" />
            </div>
            <div className="divide-y divide-[#D9D2C3]/60">
              {[1, 2, 3, 4].map((row) => (
                <div key={row} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 flex-1">
                    <div className="w-14 h-14 rounded-lg bg-[#D5BFA1]/65 animate-pulse shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 w-24 rounded bg-[#1B1712]/15 animate-pulse" />
                      <div className="h-4 w-52 rounded bg-[#1B1712]/20 animate-pulse" />
                    </div>
                  </div>
                  <div className="h-5 w-24 rounded bg-[#1B1712]/15 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-5 glass-clear continuous-card p-6 space-y-4">
            <div className="h-5 w-36 rounded bg-[#1B1712]/15 animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="py-3 border-b border-[#D9D2C3]/60 last:border-b-0 flex items-center justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-32 rounded bg-[#1B1712]/20 animate-pulse" />
                    <div className="h-3 w-44 rounded bg-[#1B1712]/10 animate-pulse" />
                  </div>
                  <div className="h-4 w-16 rounded bg-[#8A3B12]/25 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'error') {
    return (
      <div
        role="alert"
        className="glass-clear rounded-3xl p-8 flex flex-col items-start gap-4 max-w-2xl"
      >
        <div className="w-11 h-11 rounded-xl bg-[#991B1B]/10 text-[#991B1B] flex items-center justify-center">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl text-[#1B1712]">Unable to load records</h2>
          <p className="text-sm text-[#4A4237] leading-relaxed">{errorMessage}</p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="h-11 px-5 rounded-xl bg-[#8A3B12] hover:bg-[#702F0D] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  if (mode === 'empty') {
    return (
      <div className="glass-clear rounded-3xl p-10 flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/70 border border-[#D9D2C3] text-[#5C5446] flex items-center justify-center">
          <Inbox className="w-5 h-5" />
        </div>
        <div className="space-y-1.5 max-w-md">
          <h2 className="text-xl text-[#1B1712]">{emptyTitle}</h2>
          <p className="text-sm text-[#4A4237] leading-relaxed">
            {emptyDescription}
          </p>
        </div>
        {emptyActionLabel && onEmptyAction && (
          <button
            type="button"
            onClick={onEmptyAction}
            className="h-12 px-6 rounded-xl bg-[#8A3B12] hover:bg-[#702F0D] text-white text-sm font-semibold transition-colors"
          >
            {emptyActionLabel}
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
};
