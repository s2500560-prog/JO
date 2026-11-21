import React, { useState } from 'react';
import {
  CheckCircle2,
  Package,
  Plus,
  Trash2,
  Truck,
} from 'lucide-react';
import { FormError } from '../components/FormError';
import { ShippingStatusText } from '../components/StatusText';
import { PredictiveBackButton } from '../components/UxOverlays';
import {
  calculateCostingAndMaterialsReport,
  canCreateRequisitionForOrder,
  formatPeso,
  formatPesoWhole,
} from '../logic/workshopRules';
import type {
  MaterialRequisition,
  Order,
  RequisitionLineItem,
  ShippingStatus,
} from '../types/saw2sale';

interface MaterialsScreenProps {
  orders: Order[];
  requisitions: MaterialRequisition[];
  selectedReqId: string | null;
  creatingForJo: string | null;
  onSelectReq: (reqId: string | null) => void;
  onStartCreate: (joNumber?: string) => void;
  onCancelCreate: () => void;
  onCreateRequisition: (params: {
    joNumber: string;
    supplier: string;
    expectedDate: string;
    lineItems: Omit<RequisitionLineItem, 'id'>[];
  }) => void;
  onUpdateShippingStatus: (reqId: string, status: ShippingStatus) => void;
}

const SHIPPING_STEPS: ShippingStatus[] = ['Ordered', 'In transit', 'Received'];

export const MaterialsScreen: React.FC<MaterialsScreenProps> = ({
  orders,
  requisitions,
  selectedReqId,
  creatingForJo,
  onSelectReq,
  onStartCreate,
  onCancelCreate,
  onCreateRequisition,
  onUpdateShippingStatus,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<
    'All' | 'Lumber' | 'Hardware' | 'Finish'
  >('All');

  // Form state for New Requisition
  const activeOrders = orders.filter(
    (o) => o.status !== 'Declined' && o.status !== 'Draft',
  );
  const [formJo, setFormJo] = useState(
    creatingForJo || activeOrders[0]?.joNumber || 'JO-2026-0001',
  );
  const [supplier, setSupplier] = useState('City Lumber Supply');
  const [expectedDate, setExpectedDate] = useState('2026-11-24');
  const [items, setItems] = useState<Array<Omit<RequisitionLineItem, 'id'>>>([
    {
      description: 'Kiln-Dried Narra Planks 1" × 8"',
      category: 'Lumber',
      quantity: 20,
      unit: 'bd ft',
      unitCost: 165,
    },
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  const totalLoggedCost = requisitions.reduce(
    (sum, r) =>
      sum + r.lineItems.reduce((ls, li) => ls + li.quantity * li.unitCost, 0),
    0,
  );
  const report = calculateCostingAndMaterialsReport(orders, requisitions, []);

  // Sub-screen 1: New Requisition Form
  if (creatingForJo !== null) {
    const pickedOrder = orders.find((o) => o.joNumber === formJo);
    const permission = pickedOrder
      ? canCreateRequisitionForOrder(pickedOrder)
      : { allowed: false, reason: 'Select a valid job order.' };

    const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      if (!permission.allowed) {
        setFormError(permission.reason ?? 'Requisition not permitted.');
        return;
      }
      if (!supplier.trim()) {
        setFormError('Supplier name is required.');
        return;
      }
      if (
        items.length === 0 ||
        items.some((i) => !i.description.trim() || i.quantity <= 0)
      ) {
        setFormError('Add at least one valid material line item.');
        return;
      }
      setFormError(null);
      onCreateRequisition({
        joNumber: formJo,
        supplier: supplier.trim(),
        expectedDate,
        lineItems: items,
      });
    };

    return (
      <form onSubmit={handleSave} className="space-y-6 w-full" noValidate>
        <div className="flex items-center justify-between">
          <PredictiveBackButton
            label="Back to Requisitions"
            onBack={onCancelCreate}
          />
          <div className="text-xs font-semibold text-[#5C5446]">
            New Material Requisition
          </div>
        </div>

        <div className="glass-clear continuous-card p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="req-jo"
                className="block text-xs font-semibold text-[#4A4237] mb-1.5"
              >
                Linked Job Order
              </label>
              <select
                id="req-jo"
                value={formJo}
                onChange={(e) => {
                  setFormJo(e.target.value);
                  setFormError(null);
                }}
                className="w-full h-11 px-3 rounded-lg bg-white border border-[#D9D2C3] text-sm text-[#1B1712]"
              >
                {activeOrders.map((o) => (
                  <option key={o.id} value={o.joNumber}>
                    {o.joNumber} — {o.specs.piece} (
                    {o.serviceType === 'labor-only' ? 'Labor-Only' : 'Full-Build'}
                    )
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="req-supplier"
                className="block text-xs font-semibold text-[#4A4237] mb-1.5"
              >
                Supplier
              </label>
              <input
                id="req-supplier"
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#D9D2C3] text-sm text-[#1B1712]"
              />
            </div>

            <div>
              <label
                htmlFor="req-expected"
                className="block text-xs font-semibold text-[#4A4237] mb-1.5"
              >
                Expected Delivery
              </label>
              <input
                id="req-expected"
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#D9D2C3] text-sm text-[#1B1712] tabular-nums"
              />
            </div>
          </div>

          {!permission.allowed && (
            <div
              role="alert"
              className="p-4 rounded-2xl bg-[#9A5B13]/15 border border-[#9A5B13]/30 text-sm font-semibold text-[#1B1712] flex items-center gap-3"
            >
              <Package className="w-5 h-5 text-[#9A5B13] shrink-0" />
              <div>
                <div>Client supplies materials</div>
                <div className="text-xs font-normal text-[#4A4237]">
                  {permission.reason} Select a Full-Build job order to log a
                  workshop purchase requisition.
                </div>
              </div>
            </div>
          )}

          {/* Line items */}
          <div className="space-y-3 pt-2 border-t border-[#D9D2C3]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display text-[#1B1712]">
                Line Items
              </h3>
              <button
                type="button"
                onClick={() =>
                  setItems([
                    ...items,
                    {
                      description: '',
                      category: 'Hardware',
                      quantity: 1,
                      unit: 'pcs',
                      unitCost: 0,
                    },
                  ])
                }
                className="h-9 px-3 rounded-xl border border-[#D9D2C3] bg-white text-xs font-semibold text-[#1B1712] inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Line Item
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                >
                  <input
                    type="text"
                    aria-label={`Line item ${idx + 1} description`}
                    placeholder="Material description"
                    value={item.description}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx] = { ...item, description: e.target.value };
                      setItems(next);
                    }}
                    className="sm:col-span-5 h-10 px-3 rounded-lg bg-white border border-[#D9D2C3] text-sm"
                  />
                  <select
                    aria-label={`Line item ${idx + 1} category`}
                    value={item.category}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx] = {
                        ...item,
                        category: e.target.value as RequisitionLineItem['category'],
                      };
                      setItems(next);
                    }}
                    className="sm:col-span-2 h-10 px-2.5 rounded-lg bg-white border border-[#D9D2C3] text-sm"
                  >
                    <option value="Lumber">Lumber</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Finish">Finish</option>
                  </select>
                  <input
                    type="number"
                    aria-label={`Line item ${idx + 1} quantity`}
                    min={1}
                    value={item.quantity}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx] = {
                        ...item,
                        quantity: Number(e.target.value) || 0,
                      };
                      setItems(next);
                    }}
                    className="sm:col-span-1 h-10 px-2 rounded-lg bg-white border border-[#D9D2C3] text-sm tabular-nums"
                  />
                  <input
                    type="text"
                    aria-label={`Line item ${idx + 1} unit`}
                    value={item.unit}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx] = { ...item, unit: e.target.value };
                      setItems(next);
                    }}
                    className="sm:col-span-1 h-10 px-2 rounded-lg bg-white border border-[#D9D2C3] text-sm"
                  />
                  <input
                    type="number"
                    aria-label={`Line item ${idx + 1} unit cost`}
                    min={0}
                    value={item.unitCost}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx] = {
                        ...item,
                        unitCost: Number(e.target.value) || 0,
                      };
                      setItems(next);
                    }}
                    className="sm:col-span-2 h-10 px-3 rounded-lg bg-white border border-[#D9D2C3] text-sm tabular-nums"
                  />
                  <button
                    type="button"
                    aria-label={`Remove line item ${idx + 1}`}
                    onClick={() =>
                      setItems(items.filter((_, i) => i !== idx))
                    }
                    className="sm:col-span-1 h-10 rounded-lg border border-[#D9D2C3] bg-white text-[#991B1B] inline-flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <FormError message={formError} />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#D9D2C3]">
            <div className="text-sm font-semibold tabular-nums">
              Requisition Total:{' '}
              {formatPeso(
                items.reduce((s, li) => s + li.quantity * li.unitCost, 0),
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={onCancelCreate}
                className="h-11 px-5 rounded-xl border border-[#D9D2C3] bg-white text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!permission.allowed}
                className="h-11 px-6 rounded-xl bg-[#8A3B12] hover:bg-[#702F0D] disabled:opacity-50 text-white text-sm font-semibold"
              >
                Save Requisition
              </button>
            </div>
          </div>
        </div>
      </form>
    );
  }

  // Sub-screen 2: Requisition Detail (Shipping status Ordered -> In transit -> Received)
  const selectedReq = requisitions.find((r) => r.id === selectedReqId);
  if (selectedReq) {
    const reqTotal = selectedReq.lineItems.reduce(
      (s, li) => s + li.quantity * li.unitCost,
      0,
    );
    const currentStepIdx = SHIPPING_STEPS.indexOf(selectedReq.shippingStatus);

    return (
      <div className="space-y-6 w-full">
        <PredictiveBackButton
          label="Back to Requisitions"
          onBack={() => onSelectReq(null)}
        />

        <div className="glass-clear continuous-card p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-[#D9D2C3] pb-4">
            <div className="min-w-0 break-words">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-code text-xs text-[#5C5446]">
                  {selectedReq.reqNumber}
                </span>
                <span className="font-code text-xs text-[#8A3B12]">
                  {selectedReq.joNumber}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl text-[#1B1712] mt-1 break-words">
                {selectedReq.itemTitle}
              </h2>
              <div className="text-sm text-[#4A4237] break-words">
                Supplier: {selectedReq.supplier} · Expected{' '}
                {selectedReq.expectedDate}
              </div>
            </div>
            <div className="sm:text-right shrink-0">
              <div className="text-xs text-[#5C5446]">Requisition Total</div>
              <div className="font-display text-2xl text-[#1B1712] tabular-nums">
                {formatPeso(reqTotal)}
              </div>
            </div>
          </div>

          {/* Shipping Status Stepper */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-[#4A4237]">
              Shipping Status
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SHIPPING_STEPS.map((step, idx) => {
                const isActive = idx === currentStepIdx;
                const isDone = idx < currentStepIdx;
                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => onUpdateShippingStatus(selectedReq.id, step)}
                    className={`p-4 rounded-2xl border text-left transition-colors ${
                      isActive
                        ? 'bg-[#1B1712] text-white border-[#1B1712]'
                        : isDone
                          ? 'bg-[#1F6B43]/15 text-[#1F6B43] border-[#1F6B43]/30'
                          : 'bg-white/70 text-[#4A4237] border-[#D9D2C3] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs opacity-75">Step {idx + 1}</span>
                      {isDone || (isActive && step === 'Received') ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Truck className="w-4 h-4 opacity-70" />
                      )}
                    </div>
                    <div className="text-sm font-semibold mt-1">{step}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#D9D2C3] text-xs font-semibold text-[#5C5446]">
                  <th className="py-2.5 pr-4">Description</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4 text-right">Qty</th>
                  <th className="py-2.5 px-4 text-right">Unit Cost</th>
                  <th className="py-2.5 pl-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9D2C3]/70 text-sm">
                {selectedReq.lineItems.map((li) => (
                  <tr key={li.id}>
                    <td className="py-3 pr-4 font-semibold text-[#1B1712]">
                      {li.description}
                    </td>
                    <td className="py-3 px-4 text-[#4A4237]">{li.category}</td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      {li.quantity} {li.unit}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      {formatPeso(li.unitCost)}
                    </td>
                    <td className="py-3 pl-4 text-right font-semibold tabular-nums">
                      {formatPeso(li.quantity * li.unitCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Sub-screen 3: Requisitions List
  const filteredReqs = requisitions.filter((req) => {
    if (categoryFilter === 'All') return true;
    return req.lineItems.some((li) => li.category === categoryFilter);
  });

  const bomBudget = report.estimatedBomMaterials;
  const spentPct =
    bomBudget > 0 ? Math.round((totalLoggedCost / bomBudget) * 100) : 0;
  const remainingBudget = bomBudget - totalLoggedCost;
  const isOverBudget = remainingBudget < 0;
  const categoryItems = (['Lumber', 'Hardware', 'Finish'] as const).map(
    (category) => {
      const amount = report.categorySpend[category];
      const sharePct =
        totalLoggedCost > 0 ? Math.round((amount / totalLoggedCost) * 100) : 0;
      return { category, amount, sharePct };
    },
  );

  return (
    <div className="space-y-6 w-full">
      {/* Top Row: 3 Equal KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass-clear continuous-card p-5 space-y-1.5">
          <div className="text-xs font-semibold text-[#5C5446]">
            Est. BOM Budget
          </div>
          <div className="font-display text-2xl text-[#1B1712] tabular-nums">
            {formatPesoWhole(bomBudget)}
          </div>
          <div className="text-xs text-[#5C5446]">
            Active full-build estimates
          </div>
        </div>

        <div className="glass-clear continuous-card p-5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#5C5446]">
              Logged PO Spend
            </span>
            <span className="text-xs font-semibold text-[#8A3B12] tabular-nums">
              {spentPct}% of BOM
            </span>
          </div>
          <div className="font-display text-2xl text-[#1B1712] tabular-nums">
            {formatPesoWhole(totalLoggedCost)}
          </div>
          <div
            className="w-full h-1.5 rounded-full bg-[#D9D2C3] overflow-hidden"
            aria-label={`${spentPct}% of BOM budget spent`}
          >
            <div
              className={`h-full rounded-full transition-all ${
                isOverBudget ? 'bg-[#991B1B]' : 'bg-[#8A3B12]'
              }`}
              style={{ width: `${Math.min(100, spentPct)}%` }}
            />
          </div>
        </div>

        <div className="glass-clear continuous-card p-5 space-y-1.5">
          <div className="text-xs font-semibold text-[#5C5446]">
            {isOverBudget ? 'Over Budget' : 'Remaining Budget'}
          </div>
          <div
            className={`font-display text-2xl tabular-nums ${
              isOverBudget ? 'text-[#991B1B]' : 'text-[#1F6B43]'
            }`}
          >
            {formatPesoWhole(Math.abs(remainingBudget))}
          </div>
          <div className="text-xs text-[#5C5446] tabular-nums">
            {isOverBudget
              ? `${spentPct - 100}% above BOM estimate`
              : `${Math.max(0, 100 - spentPct)}% unallocated`}
          </div>
        </div>
      </div>

      {/* Separate Category Breakdown */}
      <div className="glass-clear continuous-card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 lg:divide-x divide-[#D9D2C3]/70">
        {categoryItems.map((cat) => (
          <div
            key={cat.category}
            className="py-3 first:pt-1 last:pb-1 sm:py-2 sm:px-3 lg:py-0 lg:px-4 lg:first:pl-2 lg:last:pr-2 space-y-1.5"
          >
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-[#5C5446]">{cat.category}</span>
              <span className="font-semibold text-[#8A3B12] tabular-nums">
                {cat.sharePct}% share
              </span>
            </div>
            <div className="font-display text-xl text-[#1B1712] tabular-nums">
              {formatPesoWhole(cat.amount)}
            </div>
            <div className="w-full h-1 rounded-full bg-[#D9D2C3] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#8A3B12]/75"
                style={{ width: `${cat.sharePct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div
          role="group"
          aria-label="Filter requisitions by category"
          className="flex items-center gap-2 flex-wrap"
        >
          {(['All', 'Lumber', 'Hardware', 'Finish'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              aria-pressed={categoryFilter === cat}
              title={`Show ${cat} requisitions`}
              className={`btn-scale h-9 px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-[#8A3B12] text-white'
                  : 'glass-frosted text-[#4A4237] hover:text-[#1B1712]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onStartCreate()}
          title="Create a supplier material requisition"
          className="btn-scale w-full sm:w-auto h-12 px-5 rounded-xl bg-[#8A3B12] hover:bg-[#702F0D] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Requisition
        </button>
      </div>

      <div className="w-full glass-clear continuous-card overflow-hidden">
        <div className="divide-y divide-[#D9D2C3]/70">
          {filteredReqs.map((req) => {
            const total = req.lineItems.reduce(
              (s, li) => s + li.quantity * li.unitCost,
              0,
            );
            return (
              <button
                key={req.id}
                type="button"
                onClick={() => onSelectReq(req.id)}
                title={`Open ${req.reqNumber} to update shipping status`}
                className="group w-full p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 text-left hover:bg-white/45 transition-colors"
              >
                <div className="w-full min-w-0 space-y-1 break-words">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-code text-xs text-[#5C5446]">
                      {req.reqNumber}
                    </span>
                    <span className="font-code text-xs text-[#8A3B12]">
                      {req.joNumber}
                    </span>
                  </div>
                  <div className="text-base font-semibold text-[#1B1712] break-words">
                    {req.itemTitle}
                  </div>
                  <div className="text-xs text-[#5C5446] break-words">
                    {req.supplier} · {req.lineItems.length} items · Expected{' '}
                    {req.expectedDate}
                  </div>
                </div>
                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-4 sm:gap-6 shrink-0">
                  <span className="hidden sm:inline text-[11px] font-semibold text-[#8A3B12] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity whitespace-nowrap">
                    Update shipping →
                  </span>
                  <ShippingStatusText status={req.shippingStatus} />
                  <span className="text-base font-semibold tabular-nums text-[#1B1712] sm:w-28 text-right">
                    {formatPeso(total)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-4 sm:px-5 py-4 bg-[#F5F2EA]/80 border-t border-[#D9D2C3] flex items-center justify-between gap-3 flex-wrap">
          <span className="text-sm font-semibold text-[#4A4237]">
            Total Logged Requisitions
          </span>
          <span className="font-display text-xl text-[#1B1712] tabular-nums">
            {formatPeso(totalLoggedCost)}
          </span>
        </div>
      </div>
    </div>
  );
};
