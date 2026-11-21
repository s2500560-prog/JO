import React, { useState } from 'react';
import { CheckCircle2, Download, RotateCcw } from 'lucide-react';
import {
  exportOrdersToCsv,
  exportPaymentsToCsv,
} from '../logic/workshopRules';
import type { Order, PaymentRecord, WorkshopSettings } from '../types/saw2sale';

interface SettingsScreenProps {
  settings: WorkshopSettings;
  orders: Order[];
  payments: PaymentRecord[];
  onUpdateSettings: (next: WorkshopSettings) => void;
  onResetDemoData: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  orders,
  payments,
  onUpdateSettings,
  onResetDemoData,
}) => {
  const [form, setForm] = useState<WorkshopSettings>(settings);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const triggerDownload = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSavedNotice(`Exported ${filename}`);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(form);
    setSavedNotice('Workshop pricing defaults saved.');
  };

  return (
    <div className="space-y-6 w-full">
      {savedNotice && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-[#1F6B43]/15 border border-[#1F6B43]/30 text-sm font-semibold text-[#1F6B43] flex items-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* CSV Backup Export */}
      <div className="glass-clear continuous-card p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl text-[#1B1712]">Export Backup (CSV)</h2>
          <span className="text-xs text-[#5C5446]">Orders &amp; ledger</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() =>
              triggerDownload(
                'saw2sale-orders-backup.csv',
                exportOrdersToCsv(orders, payments),
              )
            }
            title="Download all job orders as CSV"
            className="btn-scale h-12 px-5 rounded-xl bg-[#8A3B12] hover:bg-[#702F0D] text-white text-sm font-semibold inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Orders (CSV)
          </button>

          <button
            type="button"
            onClick={() =>
              triggerDownload(
                'saw2sale-payments-backup.csv',
                exportPaymentsToCsv(payments),
              )
            }
            title="Download payment transactions as CSV"
            className="btn-scale h-12 px-5 rounded-xl border border-[#D9D2C3] bg-white/80 hover:bg-white text-sm font-semibold text-[#1B1712] inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Payments (CSV)
          </button>
        </div>
      </div>

      {/* Workshop & Quotation Defaults */}
      <form
        onSubmit={handleSave}
        className="glass-clear rounded-3xl p-6 space-y-5"
      >
        <h2 className="text-xl text-[#1B1712]">Workshop &amp; Quote Rules</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="set-name"
              className="block text-xs font-semibold text-[#4A4237] mb-1.5"
            >
              Workshop Name
            </label>
            <input
              id="set-name"
              type="text"
              value={form.workshopName}
              onChange={(e) =>
                setForm({ ...form, workshopName: e.target.value })
              }
              className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#D9D2C3] text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="set-location"
              className="block text-xs font-semibold text-[#4A4237] mb-1.5"
            >
              Location
            </label>
            <input
              id="set-location"
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#D9D2C3] text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="set-rate"
              className="block text-xs font-semibold text-[#4A4237] mb-1.5"
            >
              Default Labor Rate (₱ / hr)
            </label>
            <input
              id="set-rate"
              type="number"
              min={50}
              value={form.defaultHourlyRate}
              onChange={(e) =>
                setForm({
                  ...form,
                  defaultHourlyRate: Number(e.target.value) || 250,
                })
              }
              className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#D9D2C3] text-sm tabular-nums"
            />
          </div>

          <div>
            <label
              htmlFor="set-markup"
              className="block text-xs font-semibold text-[#4A4237] mb-1.5"
            >
              Shop Markup (%)
            </label>
            <input
              id="set-markup"
              type="number"
              min={0}
              max={100}
              value={Math.round(form.defaultMarkupRate * 100)}
              onChange={(e) =>
                setForm({
                  ...form,
                  defaultMarkupRate: (Number(e.target.value) || 0) / 100,
                })
              }
              className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#D9D2C3] text-sm tabular-nums"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              onResetDemoData();
              setSavedNotice('Workshop data restored to initial seed records.');
            }}
            className="h-11 px-4 rounded-xl border border-[#D9D2C3] bg-white/80 hover:bg-white text-xs font-semibold text-[#4A4237] inline-flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Data
          </button>

          <button
            type="submit"
            className="h-11 px-5 rounded-xl bg-[#1B1712] hover:bg-[#332C24] text-white text-sm font-semibold"
          >
            Save Defaults
          </button>
        </div>
      </form>
    </div>
  );
};
