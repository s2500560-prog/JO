import React, { useEffect } from 'react';
import {
  ClipboardList,
  CreditCard,
  Hammer,
  Home,
  LogOut,
  Package,
  Settings,
  Users,
  X,
} from 'lucide-react';
import type { NavSection } from '../types/saw2sale';
import { prefetchRouteData } from '../utils/uxPrimitives';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  userEmail?: string | null;
  onSignOut?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'production', label: 'Production', icon: Hammer },
  { id: 'materials', label: 'Materials', icon: Package },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  userEmail,
  onSignOut,
  mobileOpen = false,
  onCloseMobile,
}) => {
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseMobile?.();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen, onCloseMobile]);

  const renderNavAndFooter = (isMobileDrawer: boolean) => (
    <>
      <div className="space-y-6">
        {/* Wordmark + Mobile Close Button */}
        <div className="flex items-center justify-between gap-2 px-2 pt-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-white overflow-hidden shadow-xs shrink-0 flex items-center justify-center">
              <img
                src="./assets/aistudio/image_ad50d4bb.png"
                alt="Saw2Sale logo"
                className="w-full h-full object-cover scale-[1.24]"
              />
            </div>
            <div className="font-display text-lg font-bold tracking-wider leading-none text-[#1B1712] truncate">
              SAW2SALE
            </div>
          </div>

          {isMobileDrawer && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              className="hit-slop w-9 h-9 rounded-lg hover:bg-white/60 inline-flex items-center justify-center text-[#1B1712] shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation links */}
        <nav className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => prefetchRouteData(`nav:${item.id}`)}
                onFocus={() => prefetchRouteData(`nav:${item.id}`)}
                onClick={() => {
                  onSelectSection(item.id);
                  if (isMobileDrawer) {
                    onCloseMobile?.();
                  }
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`hit-slop w-full h-11 px-3 border border-transparent continuous-control flex items-center gap-3 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A3B12] ${
                  isActive
                    ? 'bg-[#1B1712] text-white'
                    : 'text-[#4A4237] hover:bg-white/60 hover:text-[#1B1712]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Account & Sign Out */}
      {(userEmail || onSignOut) && (
        <div className="pt-4 border-t border-[#D9D2C3] space-y-2.5">
          {userEmail && (
            <div className="px-2">
              <div className="text-xs font-semibold text-[#1B1712] truncate">
                {userEmail}
              </div>
            </div>
          )}
          {onSignOut && (
            <button
              type="button"
              onClick={() => {
                if (isMobileDrawer) onCloseMobile?.();
                onSignOut();
              }}
              className="w-full h-10 px-3 continuous-control border border-[#D9D2C3] bg-white/60 hover:bg-white text-xs font-semibold text-[#4A4237] hover:text-[#1B1712] flex items-center gap-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A3B12]"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar (lg and above) */}
      <aside
        aria-label="Workshop navigation"
        className="no-print hidden lg:flex w-60 shrink-0 glass-frosted continuous-card p-4 flex-col justify-between sticky top-0 h-screen self-start overflow-y-auto [scrollbar-gutter:stable]"
      >
        {renderNavAndFooter(false)}
      </aside>

      {/* Mobile / Tablet Slide-Over Drawer (below lg) */}
      {mobileOpen && (
        <div
          className="no-print fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile workshop navigation"
        >
          <div
            onClick={onCloseMobile}
            aria-hidden="true"
            className="fixed inset-0 bg-[#1B1712]/55 backdrop-blur-xs"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] h-full glass-frosted p-5 flex flex-col justify-between overflow-y-auto shadow-2xl">
            {renderNavAndFooter(true)}
          </aside>
        </div>
      )}
    </>
  );
};
