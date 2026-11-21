import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ChevronRight,
  Command,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';

export interface CommandItem {
  id: string;
  label: string;
  detail: string;
  shortcut?: string;
  group: 'Navigation' | 'Orders' | 'Customers' | 'Actions';
  onRun: () => void;
}

interface CommandMenuProps {
  open: boolean;
  onClose: () => void;
  items: CommandItem[];
}

export const CommandMenu: React.FC<CommandMenuProps> = ({
  open,
  onClose,
  items,
}) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = items.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      item.label.toLowerCase().includes(q) ||
      item.detail.toLowerCase().includes(q) ||
      item.group.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter' && filtered[activeIndex]) {
        e.preventDefault();
        filtered[activeIndex].onRun();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, filtered, activeIndex, onClose]);

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
          className="fixed inset-0 z-50 bg-[#1B1712]/35 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Workshop command menu"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ type: 'spring', stiffness: 440, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl glass-frosted continuous-card overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#D9D2C3]">
              <Search className="w-4 h-4 text-[#5C5446] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                placeholder="Jump to order, customer, or screen…"
                aria-label="Search command menu"
                className="flex-1 bg-transparent text-sm text-[#1B1712] placeholder:text-[#5C5446] focus:outline-none"
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close command menu"
                className="hit-slop w-7 h-7 rounded-lg hover:bg-white/70 inline-flex items-center justify-center text-[#4A4237]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-[#D9D2C3]/50">
              {filtered.length === 0 ? (
                <div className="p-6 text-center text-sm text-[#5C5446]">
                  No matching workshop commands.
                </div>
              ) : (
                filtered.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => {
                      item.onRun();
                      onClose();
                    }}
                    className={`w-full px-4 py-3 flex items-center justify-between gap-3 text-left transition-colors ${
                      idx === activeIndex
                        ? 'bg-[#1B1712] text-white'
                        : 'hover:bg-white/45 text-[#1B1712]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {item.label}
                      </div>
                      <div
                        className={`text-xs truncate ${
                          idx === activeIndex ? 'text-white/75' : 'text-[#5C5446]'
                        }`}
                      >
                        {item.group} · {item.detail}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.shortcut && (
                        <kbd
                          className={`text-[11px] font-semibold px-1.5 py-0.5 rounded border ${
                            idx === activeIndex
                              ? 'border-white/25 text-white/90'
                              : 'border-[#D9D2C3] bg-white/60 text-[#5C5446]'
                          }`}
                        >
                          {item.shortcut}
                        </kbd>
                      )}
                      <ChevronRight className="w-4 h-4 opacity-60" />
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="px-4 py-2.5 bg-white/40 border-t border-[#D9D2C3] flex items-center justify-between text-[11px] text-[#5C5446]">
              <span className="inline-flex items-center gap-1.5">
                <Command className="w-3 h-3" />
                <span>Select to jump straight there</span>
              </span>
              <span className="tabular-nums">{filtered.length} options</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined'
    ? createPortal(content, document.body)
    : content;
};

export interface UndoToastState {
  id: string;
  message: string;
  onUndo: () => void;
}

interface UndoToastBarProps {
  toast: UndoToastState | null;
  onDismiss: () => void;
}

export const UndoToastBar: React.FC<UndoToastBarProps> = ({
  toast,
  onDismiss,
}) => {
  const content = (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-6 right-6 z-40 glass-dark text-white continuous-control px-4 py-3 flex items-center gap-4 safe-bottom"
        >
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            type="button"
            onClick={() => {
              toast.onUndo();
              onDismiss();
            }}
            className="h-8 px-3 rounded-lg bg-white text-[#1B1712] hover:bg-[#F5F2EA] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Undo
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss notification"
            className="hit-slop w-7 h-7 rounded-lg hover:bg-white/15 inline-flex items-center justify-center text-white/75"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined'
    ? createPortal(content, document.body)
    : content;
};

interface SwipeableSheetProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Interruptible Swipe-to-Dismiss Sheet with safe-area bottom inset.
 */
export const SwipeableSheet: React.FC<SwipeableSheetProps> = ({
  open,
  title,
  subtitle,
  onClose,
  children,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-[#1B1712]/35 backdrop-blur-sm flex items-end justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 260 }}
            dragElastic={{ top: 0.05, bottom: 0.45 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 420) {
                onClose();
              }
            }}
            initial={{ y: 72, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto glass-frosted continuous-card p-6 safe-bottom space-y-5 cursor-grab active:cursor-grabbing"
          >
            {/* Swipe Handle */}
            <div className="flex flex-col items-center gap-1 -mt-2">
              <div
                className="w-10 h-1 rounded-full bg-[#4A4237]/30"
                aria-hidden="true"
              />
            </div>

            <div className="flex items-start justify-between gap-4 border-b border-[#D9D2C3] pb-3">
              <div>
                <h3 className="text-xl font-display text-[#1B1712]">{title}</h3>
                {subtitle && (
                  <p className="text-xs text-[#5C5446] mt-0.5">{subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={`Close ${title}`}
                className="hit-slop w-8 h-8 rounded-lg hover:bg-white/70 inline-flex items-center justify-center text-[#4A4237]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="cursor-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined'
    ? createPortal(content, document.body)
    : content;
};

interface PredictiveBackButtonProps {
  label: string;
  onBack: () => void;
  shortcut?: string;
}

export const PredictiveBackButton: React.FC<PredictiveBackButtonProps> = ({
  label,
  onBack,
}) => {
  const [peeking, setPeeking] = useState(false);

  return (
    <button
      type="button"
      onClick={onBack}
      onMouseEnter={() => setPeeking(true)}
      onMouseLeave={() => setPeeking(false)}
      title={`Return: ${label}`}
      className="btn-scale hit-slop h-10 px-4 continuous-control glass-frosted text-xs font-semibold text-[#1B1712] inline-flex items-center gap-2 hover:bg-white"
      style={{ transform: peeking ? 'translateX(-3px) scale(1.03)' : undefined }}
    >
      <ArrowLeft className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
};

