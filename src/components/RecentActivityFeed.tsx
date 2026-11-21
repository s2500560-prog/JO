import React from 'react';
import {
  Activity,
  ArrowRight,
  ClipboardList,
  CreditCard,
  Hammer,
  Package,
  Truck,
} from 'lucide-react';
import type { ActivityCategory, ActivityEntry } from '../types/saw2sale';

interface RecentActivityFeedProps {
  activities: ActivityEntry[];
  onOpenOrder?: (joNumber: string) => void;
}

const CATEGORY_ICON: Record<ActivityCategory, React.ReactNode> = {
  order: <ClipboardList className="w-4 h-4 text-[#8A3B12]" />,
  payment: <CreditCard className="w-4 h-4 text-[#1F6B43]" />,
  production: <Hammer className="w-4 h-4 text-[#9A5B13]" />,
  material: <Package className="w-4 h-4 text-[#8A3B12]" />,
  delivery: <Truck className="w-4 h-4 text-[#1F6B43]" />,
};

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  activities,
  onOpenOrder,
}) => {
  const recentItems = activities.slice(0, 5);

  return (
    <section
      aria-labelledby="home-activity-heading"
      className="w-full glass-clear continuous-card p-5 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#8A3B12] shrink-0" />
          <h2 id="home-activity-heading" className="text-xl text-[#1B1712]">
            Recent Activity
          </h2>
        </div>
        <span className="text-xs font-medium text-[#5C5446] whitespace-nowrap">
          Last 5 actions
        </span>
      </div>

      {recentItems.length === 0 ? (
        <p className="text-sm text-[#5C5446] py-4">
          No recent workshop activity logged yet.
        </p>
      ) : (
        <div className="divide-y divide-[#D9D2C3]/70">
          {recentItems.map((item) => {
            const joNumber = item.joNumber;
            const canOpen = Boolean(joNumber && onOpenOrder);
            const rowContent = (
              <>
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-white/75 border border-[#D9D2C3]/80 flex items-center justify-center shrink-0 mt-0.5">
                    {CATEGORY_ICON[item.category]}
                  </div>
                  <div className="min-w-0 break-words">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[#1B1712]">
                        {item.action}
                      </span>
                      {joNumber && (
                        <span className="font-code text-xs text-[#8A3B12] whitespace-nowrap">
                          {joNumber}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#4A4237] mt-0.5 break-words">
                      {item.detail}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <span className="text-xs text-[#5C5446] tabular-nums whitespace-nowrap">
                    {item.timestamp}
                  </span>
                  {canOpen && (
                    <ArrowRight className="w-3.5 h-3.5 text-[#8A3B12] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity hidden sm:inline" />
                  )}
                </div>
              </>
            );

            if (canOpen && joNumber && onOpenOrder) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onOpenOrder(joNumber)}
                  title={`Open ${joNumber} Order Detail`}
                  className="group w-full py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 text-left hover:bg-white/40 px-2 -mx-2 rounded-xl transition-colors"
                >
                  {rowContent}
                </button>
              );
            }

            return (
              <div
                key={item.id}
                className="w-full py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4"
              >
                {rowContent}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
